import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CustomersModule } from '../customers/customers.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { CustomersCreateHandler } from './handlers/customers-create.handler';
import { OrdersCreateHandler } from './handlers/orders-create.handler';
import { OrdersFulfilledHandler } from './handlers/orders-fulfilled.handler';
import { OrdersPaidHandler } from './handlers/orders-paid.handler';
import { ProductsUpdateHandler } from './handlers/products-update.handler';
import { QueueService } from './queue.service';
import { ShopifyWebhookRouterService } from './shopify-webhook-router.service';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhooks',
    }),
    OrdersModule,
    CustomersModule,
    ProductsModule,
  ],
  providers: [
    QueueService,
    WebhookProcessor,
    ShopifyWebhookRouterService,
    OrdersCreateHandler,
    OrdersPaidHandler,
    OrdersFulfilledHandler,
    CustomersCreateHandler,
    ProductsUpdateHandler,
  ],
  exports: [QueueService],
})
export class QueueModule {}
