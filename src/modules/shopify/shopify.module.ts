import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { WebhookEventsModule } from '../webhook-events/webhook-events.module';
import { ShopifyController } from './shopify.controller';
import { ShopifyHmacService } from './shopify-hmac.service';
import { ShopifyService } from './shopify.service';

@Module({
  imports: [WebhookEventsModule, QueueModule],
  controllers: [ShopifyController],
  providers: [ShopifyService, ShopifyHmacService],
  exports: [ShopifyService, ShopifyHmacService],
})
export class ShopifyModule {}
