import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { QueueModule } from './modules/queue/queue.module';
import { ShopifyModule } from './modules/shopify/shopify.module';
import { WebhookEventsModule } from './modules/webhook-events/webhook-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),

    PrismaModule,
    HealthModule,
    OrdersModule,
    CustomersModule,
    ProductsModule,
    WebhookEventsModule,
    QueueModule,
    ShopifyModule,
  ],
})
export class AppModule {}
