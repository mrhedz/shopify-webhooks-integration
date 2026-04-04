import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ShopifyHmacService } from './shopify-hmac/shopify-hmac.service';

@Module({
  imports: [QueueModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, ShopifyHmacService],
})
export class WebhooksModule {}