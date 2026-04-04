import { Injectable } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { ShopifyWebhookHandler } from '../interfaces/shopify-webhook-handler.interface';

@Injectable()
export class OrdersFulfilledHandler implements ShopifyWebhookHandler {
  readonly topic = 'orders/fulfilled';

  constructor(private readonly ordersService: OrdersService) {}

  async handle(payload: any) {
    await this.ordersService.markAsFulfilledFromShopify(payload);
  }
}
