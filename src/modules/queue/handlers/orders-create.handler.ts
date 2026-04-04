import { Injectable } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { ShopifyWebhookHandler } from '../interfaces/shopify-webhook-handler.interface';

@Injectable()
export class OrdersCreateHandler implements ShopifyWebhookHandler {
  readonly topic = 'orders/create';

  constructor(private readonly ordersService: OrdersService) {}

  async handle(payload: any) {
    await this.ordersService.createFromShopify(payload);
  }
}
