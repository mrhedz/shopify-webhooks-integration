import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ShopifyWebhookRouterService } from './shopify-webhook-router.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopifyWebhookRouterService: ShopifyWebhookRouterService,
  ) {
    super();
  }

  async process(job: Job<{ eventId: string; topic: string; payload: any }>) {
    const { eventId, topic, payload } = job.data;

    this.logger.log(`Processing webhook event ${eventId} for topic ${topic}`);

    await this.prisma.shopifyEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSING',
        errorMessage: null,
      },
    });

    await this.shopifyWebhookRouterService.dispatch(topic, payload);

    return {
      ok: true,
      eventId,
      topic,
    };
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{ eventId: string }>) {
    this.logger.log(`Processed webhook event ${job.data.eventId}`);

    await this.prisma.shopifyEvent.update({
      where: { id: job.data.eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
        errorMessage: null,
      },
    });
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

    await this.prisma.shopifyEvent.update({
      where: { id: job.data.eventId },
      data: {
        status: 'FAILED',
        errorMessage: error?.message ?? 'Unknown queue processing error',
      },
    });
  }
}
