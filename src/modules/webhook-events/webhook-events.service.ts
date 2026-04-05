import { Injectable, Logger } from '@nestjs/common';
import { WebhookEventsRepository } from './webhook-events.repository';

type RegisterWebhookEventInput = {
  topic: string;
  shopDomain: string;
  webhookId?: string;
  resourceId?: string | null;
  idempotencyKey?: string | null;
  apiVersion?: string;
  payload: unknown;
  hmacValid: boolean;
  status?: 'RECEIVED' | 'QUEUED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'REJECTED';
  errorMessage?: string;
};

@Injectable()
export class WebhookEventsService {
  private readonly logger = new Logger(WebhookEventsService.name);

  constructor(
    private readonly webhookEventsRepository: WebhookEventsRepository,
  ) {}

  async findDuplicate(idempotencyKey?: string | null) {
    if (!idempotencyKey) {
      return null;
    }

    return this.webhookEventsRepository.findByIdempotencyKey(idempotencyKey);
  }

  async registerEvent(input: RegisterWebhookEventInput) {
    return this.webhookEventsRepository.create(input);
  }

  async markQueued(eventId: string) {
    this.logger.log(`Marking webhook event ${eventId} as queued`);
    return this.webhookEventsRepository.updateStatus(eventId, 'QUEUED');
  }

  async markProcessing(eventId: string) {
    return this.webhookEventsRepository.updateStatus(eventId, 'PROCESSING');
  }

  async markProcessed(eventId: string) {
    return this.webhookEventsRepository.updateStatus(eventId, 'PROCESSED');
  }

  async markFailed(eventId: string, errorMessage?: string) {
    return this.webhookEventsRepository.updateStatus(
      eventId,
      'FAILED',
      errorMessage,
    );
  }

  async markRejected(eventId: string, errorMessage?: string) {
    return this.webhookEventsRepository.updateStatus(
      eventId,
      'REJECTED',
      errorMessage,
    );
  }

  async findById(eventId: string) {
    return this.webhookEventsRepository.findById(eventId);
  }
}
