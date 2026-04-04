import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

type CreateWebhookEventInput = {
  topic: string;
  shopDomain: string;
  webhookId?: string;
  apiVersion?: string;
  payload: unknown;
  hmacValid: boolean;
  status?: 'RECEIVED' | 'QUEUED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'REJECTED';
  errorMessage?: string;
};

type PrismaLikeError = {
  code?: string;
};

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
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

  async saveEvent(input: CreateWebhookEventInput) {
    if (!input.webhookId) {
      const event = await this.prisma.shopifyEvent.create({
        data: {
          topic: input.topic,
          shopDomain: input.shopDomain,
          webhookId: input.webhookId,
          apiVersion: input.apiVersion,
          payload: input.payload as object,
          hmacValid: input.hmacValid,
          status: input.status ?? 'RECEIVED',
          errorMessage: input.errorMessage,
        },
      });

      return { event, created: true };
    }

    try {
      const event = await this.prisma.shopifyEvent.create({
        data: {
          topic: input.topic,
          shopDomain: input.shopDomain,
          webhookId: input.webhookId,
          apiVersion: input.apiVersion,
          payload: input.payload as object,
          hmacValid: input.hmacValid,
          status: input.status ?? 'RECEIVED',
          errorMessage: input.errorMessage,
        },
      });

      return { event, created: true };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const existingEvent = await this.prisma.shopifyEvent.findFirst({
          where: {
            topic: input.topic,
            webhookId: input.webhookId,
          },
        });

        if (existingEvent) {
          this.logger.warn(
            `Duplicate webhook ignored for topic ${input.topic} and webhookId ${input.webhookId}`,
          );

          return { event: existingEvent, created: false };
        }
      }

      throw error;
    }
  }

  async markEventAsQueued(eventId: string) {
    return this.prisma.shopifyEvent.update({
      where: { id: eventId },
      data: {
        status: 'QUEUED',
        errorMessage: null,
      },
    });
  }

  async enqueueWebhookProcess(eventId: string, topic: string, payload: any) {
    await this.queueService.addWebhookJob({
      eventId,
      topic,
      payload,
    });

    await this.markEventAsQueued(eventId);
  }
}
