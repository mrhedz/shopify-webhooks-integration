import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ShopifyHmacService {
  constructor(private readonly configService: ConfigService) {}

  isValid(rawBody: Buffer, receivedHmac?: string): boolean {
    const skipValidation =
      this.configService.get<string>('SHOPIFY_SKIP_HMAC_VALIDATION') === 'true';

    if (skipValidation) {
      return true;
    }

    if (!receivedHmac || !rawBody) {
      return false;
    }

    const secret = this.configService.get<string>('SHOPIFY_WEBHOOK_SECRET');

    if (!secret) {
      return false;
    }

    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const receivedBuffer = Buffer.from(receivedHmac, 'utf8');
    const generatedBuffer = Buffer.from(generatedHmac, 'utf8');

    if (receivedBuffer.length !== generatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, generatedBuffer);
  }
}