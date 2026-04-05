import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('webhooks')
    private readonly webhookQueue: Queue,
  ) {}

  async addWebhookJob(data: {
    eventId: string;
    topic: string;
    payload: any;
  }) {
    this.logger.log(
      `Queueing webhook event ${data.eventId} for topic ${data.topic}`,
    );

    return this.webhookQueue.add(data.topic, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50,
      removeOnFail: 50,
    });
  }
}
