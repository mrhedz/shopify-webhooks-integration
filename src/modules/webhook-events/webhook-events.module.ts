import { Module } from '@nestjs/common';
import { WebhookEventsRepository } from './webhook-events.repository';
import { WebhookEventsService } from './webhook-events.service';

@Module({
  providers: [WebhookEventsRepository, WebhookEventsService],
  exports: [WebhookEventsRepository, WebhookEventsService],
})
export class WebhookEventsModule {}
