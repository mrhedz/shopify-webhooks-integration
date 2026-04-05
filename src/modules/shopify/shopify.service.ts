import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { WebhookEventsService } from '../webhook-events/webhook-events.service';
import {
  ShopifyWebhookHeaders,
  ShopifyWebhookHelper,
} from './shopify-webhook.helper';
import { ShopifyHmacService } from './shopify-hmac.service';

type HandleWebhookInput = {
  rawBody?: Buffer;
  body: any;
  headers: ShopifyWebhookHeaders;
  hmac?: string;
};

type PrismaLikeError = {
  code?: string;
};

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  constructor(
    private readonly shopifyHmacService: ShopifyHmacService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly queueService: QueueService,
  ) {}

  private isUniqueConstraintError(error: unknown): error is PrismaLikeError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as PrismaLikeError).code === 'P2002'
    );
  }

  async handleWebhook(input: HandleWebhookInput) {
    const { body, headers, rawBody, hmac } = input;
    const resourceId = ShopifyWebhookHelper.extractResourceId(headers.topic, body);
    const idempotencyKey = ShopifyWebhookHelper.buildIdempotencyKey(
      headers.topic,
      headers.shopDomain,
      resourceId,
    );

    this.logger.log(
      `Received Shopify webhook topic=${headers.topic} shop=${headers.shopDomain} webhookId=${headers.webhookId ?? 'n/a'} resourceId=${resourceId ?? 'n/a'}`,
    );

    const hmacValidation = this.shopifyHmacService.validate(
      rawBody as Buffer,
      hmac,
    );

    if (!hmacValidation.isValid) {
      this.logger.warn(
        `Rejected Shopify webhook topic=${headers.topic} shop=${headers.shopDomain} webhookId=${headers.webhookId ?? 'n/a'} reason=${hmacValidation.reason ?? 'Unknown HMAC validation error'}`,
      );

      const rejectedEvent = await this.webhookEventsService.registerEvent({
        topic: headers.topic,
        shopDomain: headers.shopDomain,
        webhookId: headers.webhookId,
        resourceId,
        idempotencyKey: null,
        apiVersion: headers.apiVersion,
        payload: body,
        hmacValid: false,
        status: 'REJECTED',
        errorMessage:
          hmacValidation.reason ?? 'Invalid Shopify webhook HMAC signature',
      });

      await this.webhookEventsService.markRejected(
        rejectedEvent.id,
        hmacValidation.reason ?? 'Invalid Shopify webhook HMAC signature',
      );

      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(
      `Validated Shopify HMAC for topic=${headers.topic} webhookId=${headers.webhookId ?? 'n/a'}`,
    );

    const duplicateEvent =
      await this.webhookEventsService.findDuplicate(idempotencyKey);

    if (duplicateEvent) {
      this.logger.warn(
        `Duplicate webhook detected for idempotencyKey=${idempotencyKey}`,
      );

      return {
        ok: true,
        message: 'Webhook already received previously',
        eventId: duplicateEvent.id,
        duplicate: true,
      };
    }

    let savedEvent;

    try {
      savedEvent = await this.webhookEventsService.registerEvent({
        topic: headers.topic,
        shopDomain: headers.shopDomain,
        webhookId: headers.webhookId,
        resourceId,
        idempotencyKey,
        apiVersion: headers.apiVersion,
        payload: body,
        hmacValid: true,
        status: 'RECEIVED',
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const existingEvent =
          await this.webhookEventsService.findDuplicate(idempotencyKey);

        if (existingEvent) {
          this.logger.warn(
            `Duplicate webhook detected during create for idempotencyKey=${idempotencyKey}`,
          );

          return {
            ok: true,
            message: 'Webhook already received previously',
            eventId: existingEvent.id,
            duplicate: true,
          };
        }
      }

      throw error;
    }

    await this.queueService.addWebhookJob({
      eventId: savedEvent.id,
      topic: savedEvent.topic,
      payload: body,
    });

    await this.webhookEventsService.markQueued(savedEvent.id);

    this.logger.log(
      `Queued Shopify webhook event ${savedEvent.id} topic=${savedEvent.topic} idempotencyKey=${idempotencyKey}`,
    );

    return {
      ok: true,
      message: 'Webhook received and queued successfully',
      eventId: savedEvent.id,
    };
  }
}
