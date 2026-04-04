import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertFromShopify(payload: any) {
    const shopifyId = String(payload.id);

    this.logger.log(`Synchronizing product ${shopifyId}`);

    return this.prisma.product.upsert({
      where: { shopifyId },
      update: {
        title: payload.title ?? 'Untitled product',
        handle: payload.handle ?? null,
        status: payload.status ?? null,
        vendor: payload.vendor ?? null,
        productType: payload.product_type ?? null,
        rawPayload: payload,
      },
      create: {
        shopifyId,
        title: payload.title ?? 'Untitled product',
        handle: payload.handle ?? null,
        status: payload.status ?? null,
        vendor: payload.vendor ?? null,
        productType: payload.product_type ?? null,
        rawPayload: payload,
      },
    });
  }
}
