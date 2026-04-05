export type ShopifyWebhookHeaders = {
  topic: string;
  shopDomain: string;
  webhookId?: string;
  apiVersion?: string;
};

export class ShopifyWebhookHelper {
  static extractHeaders(headers: {
    topic?: string;
    shopDomain?: string;
    webhookId?: string;
    apiVersion?: string;
  }): ShopifyWebhookHeaders {
    return {
      topic: headers.topic ?? 'unknown',
      shopDomain: headers.shopDomain ?? 'unknown',
      webhookId: headers.webhookId,
      apiVersion: headers.apiVersion,
    };
  }

  static extractResourceId(topic: string, payload: any): string | null {
    switch (topic) {
      case 'orders/create':
      case 'orders/paid':
      case 'orders/fulfilled':
      case 'customers/create':
      case 'products/update':
        return payload?.id ? String(payload.id) : null;
      default:
        return payload?.id ? String(payload.id) : null;
    }
  }

  static buildIdempotencyKey(
    topic: string,
    shopDomain: string,
    resourceId: string | null,
  ): string {
    return [topic, shopDomain, resourceId ?? 'unknown-resource'].join(':');
  }
}
