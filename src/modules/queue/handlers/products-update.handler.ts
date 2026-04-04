import { Injectable } from '@nestjs/common';
import { ProductsService } from '../../products/products.service';
import { ShopifyWebhookHandler } from '../interfaces/shopify-webhook-handler.interface';

@Injectable()
export class ProductsUpdateHandler implements ShopifyWebhookHandler {
  readonly topic = 'products/update';

  constructor(private readonly productsService: ProductsService) {}

  async handle(payload: any) {
    await this.productsService.upsertFromShopify(payload);
  }
}
