import { Injectable } from '@nestjs/common';
import { CustomersService } from '../../customers/customers.service';
import { ShopifyWebhookHandler } from '../interfaces/shopify-webhook-handler.interface';

@Injectable()
export class CustomersCreateHandler implements ShopifyWebhookHandler {
  readonly topic = 'customers/create';

  constructor(private readonly customersService: CustomersService) {}

  async handle(payload: any) {
    await this.customersService.upsertFromShopify(payload);
  }
}
