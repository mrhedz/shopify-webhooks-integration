import { Injectable, Logger } from '@nestjs/common';
import { CustomersCreateHandler } from './handlers/customers-create.handler';
import { OrdersCreateHandler } from './handlers/orders-create.handler';
import { OrdersFulfilledHandler } from './handlers/orders-fulfilled.handler';
import { OrdersPaidHandler } from './handlers/orders-paid.handler';
import { ProductsUpdateHandler } from './handlers/products-update.handler';
import { ShopifyWebhookHandler } from './interfaces/shopify-webhook-handler.interface';

@Injectable()
export class ShopifyWebhookRouterService {
  private readonly logger = new Logger(ShopifyWebhookRouterService.name);
  private readonly handlers = new Map<string, ShopifyWebhookHandler>();

  constructor(
    ordersCreateHandler: OrdersCreateHandler,
    ordersPaidHandler: OrdersPaidHandler,
    ordersFulfilledHandler: OrdersFulfilledHandler,
    customersCreateHandler: CustomersCreateHandler,
    productsUpdateHandler: ProductsUpdateHandler,
  ) {
    [
      ordersCreateHandler,
      ordersPaidHandler,
      ordersFulfilledHandler,
      customersCreateHandler,
      productsUpdateHandler,
    ].forEach((handler) => {
      this.handlers.set(handler.topic, handler);
    });
  }

  async dispatch(topic: string, payload: any) {
    const handler = this.handlers.get(topic);

    if (!handler) {
      this.logger.warn(`No handler registered for topic ${topic}`);
      return;
    }

    await handler.handle(payload);
  }
}
