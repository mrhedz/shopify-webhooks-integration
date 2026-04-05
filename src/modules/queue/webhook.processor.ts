import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhookEventsService } from '../webhook-events/webhook-events.service';
import { ShopifyWebhookRouterService } from './shopify-webhook-router.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly webhookEventsService: WebhookEventsService,
    private readonly shopifyWebhookRouterService: ShopifyWebhookRouterService,
  ) {
    super();
  }

  async process(job: Job<{ eventId: string; topic: string; payload: any }>) {
    const { eventId, topic } = job.data;

    this.logger.log(`Processing webhook event ${eventId} for topic ${topic}`);

    await this.webhookEventsService.markProcessing(eventId);

    const event = await this.webhookEventsService.findById(eventId);

    if (!event) {
      throw new Error(`Webhook event ${eventId} not found`);
    }

    await this.shopifyWebhookRouterService.dispatch(topic, event.payload);

    return {
      ok: true,
      eventId,
      topic,
    };
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{ eventId: string }>) {
    this.logger.log(`Processed webhook event ${job.data.eventId}`);

    await this.webhookEventsService.markProcessed(job.data.eventId);
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job<{ eventId: string }> | undefined,
    error: Error,
  ) {
    if (!job) {
      return;
    }

    const totalAttempts =
      typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;

    const isLastAttempt = job.attemptsMade >= totalAttempts;

    if (!isLastAttempt) {
      return;
    }

    this.logger.error(
      `Webhook event ${job.data.eventId} failed`,
      error?.stack ?? error?.message,
    );

    await this.webhookEventsService.markFailed(
      job.data.eventId,
      error?.message ?? 'Unknown queue processing error',
    );
  }
}
