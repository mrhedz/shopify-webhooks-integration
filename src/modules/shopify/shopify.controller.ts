import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { ShopifyWebhookHelper } from './shopify-webhook.helper';
import { ShopifyService } from './shopify.service';

@Controller('webhooks')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Post('shopify')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleShopifyWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: any,
    @Headers('x-shopify-topic') topic?: string,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
    @Headers('x-shopify-webhook-id') webhookId?: string,
    @Headers('x-shopify-api-version') apiVersion?: string,
    @Headers('x-shopify-hmac-sha256') hmac?: string,
  ) {
    const headers = ShopifyWebhookHelper.extractHeaders({
      topic,
      shopDomain,
      webhookId,
      apiVersion,
    });

    return this.shopifyService.handleWebhook({
      rawBody: req.rawBody,
      body,
      headers,
      hmac,
    });
  }
}
