import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { ShopifyHmacService } from './shopify-hmac/shopify-hmac.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly shopifyHmacService: ShopifyHmacService,
  ) {}

  @Post('shopify')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleShopifyWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: any,
    @Headers('x-shopify-topic') topic?: string,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
    @Headers('x-shopify-webhook-id') webhookId?: string,
    @Headers('x-shopify-api-version') apiVersion?: string,
    @Headers('x-shopify-hmac-sha256') hmac?: string,
  ) {
    const safeTopic = topic ?? 'unknown';
    const safeShopDomain = shopDomain ?? 'unknown';

    this.logger.log(
      `Received webhook topic=${safeTopic} webhookId=${webhookId ?? 'n/a'} shop=${safeShopDomain}`,
    );

    const rawBody = req.rawBody;
    const isValid = this.shopifyHmacService.isValid(rawBody as Buffer, hmac);

    if (!isValid) {
      await this.webhooksService.saveEvent({
        topic: safeTopic,
        shopDomain: safeShopDomain,
        webhookId,
        apiVersion,
        payload: body,
        hmacValid: false,
        status: 'REJECTED',
        errorMessage: 'Invalid Shopify webhook HMAC signature',
      });

      throw new BadRequestException('Invalid webhook signature');
    }

    const { event: savedEvent, created } = await this.webhooksService.saveEvent({
      topic: safeTopic,
      shopDomain: safeShopDomain,
      webhookId,
      apiVersion,
      payload: body,
      hmacValid: true,
      status: 'RECEIVED',
    });

    if (!created) {
      this.logger.warn(
        `Ignoring already registered webhook event ${savedEvent.id} for topic=${safeTopic}`,
      );

      return {
        ok: true,
        message: 'Webhook already received previously',
        eventId: savedEvent.id,
        duplicate: true,
      };
    }

    await this.webhooksService.enqueueWebhookProcess(
      savedEvent.id,
      safeTopic,
      body,
    );

    this.logger.log(
      `Enqueued webhook event ${savedEvent.id} for topic=${safeTopic}`,
    );

    return {
      ok: true,
      message: 'Webhook received and queued successfully',
      eventId: savedEvent.id,
    };
  }
}
