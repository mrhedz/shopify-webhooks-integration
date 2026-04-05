import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

type ShopifyHmacValidationResult = {
  isValid: boolean;
  reason?: string;
};

@Injectable()
export class ShopifyHmacService {
  constructor(private readonly configService: ConfigService) {}

  isValid(rawBody: Buffer, receivedHmac?: string): boolean {
    return this.validate(rawBody, receivedHmac).isValid;
  }

  validate(
    rawBody: Buffer,
    receivedHmac?: string,
  ): ShopifyHmacValidationResult {
    const skipValidation =
      this.configService.get<string>('SHOPIFY_SKIP_HMAC_VALIDATION') === 'true';

    if (skipValidation) {
      return { isValid: true };
    }

    if (!receivedHmac || !rawBody) {
      return {
        isValid: false,
        reason: 'Missing raw body or x-shopify-hmac-sha256 header',
      };
    }

    const secret = this.configService.get<string>('SHOPIFY_WEBHOOK_SECRET');

    if (!secret) {
      return {
        isValid: false,
        reason: 'SHOPIFY_WEBHOOK_SECRET is not configured',
      };
    }

    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const receivedBuffer = Buffer.from(receivedHmac, 'utf8');
    const generatedBuffer = Buffer.from(generatedHmac, 'utf8');

    if (receivedBuffer.length !== generatedBuffer.length) {
      return {
        isValid: false,
        reason: 'HMAC length mismatch',
      };
    }

    const isValid = crypto.timingSafeEqual(receivedBuffer, generatedBuffer);

    if (!isValid) {
      return {
        isValid: false,
        reason: 'HMAC signature mismatch',
      };
    }

    return { isValid: true };
  }
}
