import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateWebhookEventRecordInput = {
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
export class WebhookEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateWebhookEventRecordInput) {
    return this.prisma.shopifyEvent.create({
      data: {
        topic: input.topic,
        shopDomain: input.shopDomain,
        webhookId: input.webhookId,
        resourceId: input.resourceId,
        idempotencyKey: input.idempotencyKey,
        apiVersion: input.apiVersion,
        payload: input.payload as object,
        hmacValid: input.hmacValid,
        status: input.status ?? 'RECEIVED',
        errorMessage: input.errorMessage,
      },
    });
  }

  findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.shopifyEvent.findUnique({
      where: { idempotencyKey },
    });
  }

  findById(id: string) {
    return this.prisma.shopifyEvent.findUnique({
      where: { id },
    });
  }

  updateStatus(
    id: string,
    status: 'QUEUED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'REJECTED',
    errorMessage?: string | null,
  ) {
    return this.prisma.shopifyEvent.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage ?? null,
        processedAt: status === 'PROCESSED' ? new Date() : undefined,
      },
    });
  }
}
