export interface ShopifyWebhookHandler {
  readonly topic: string;
  handle(payload: any): Promise<void>;
}
