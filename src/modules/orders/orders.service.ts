import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createFromShopify(payload: any) {
    return this.upsertOrderFromShopify(payload, 'CREATED');
  }

  async markAsPaidFromShopify(payload: any) {
    return this.upsertOrderFromShopify(payload, 'PAID');
  }

  async markAsFulfilledFromShopify(payload: any) {
    return this.upsertOrderFromShopify(payload, 'FULFILLED');
  }

  private async upsertOrderFromShopify(payload: any, status: string) {
    const items = payload.line_items ?? [];
    const shopifyId = String(payload.id);

    this.logger.log(`Synchronizing order ${shopifyId} with status ${status}`);

    return this.prisma.order.upsert({
      where: {
        shopifyId,
      },
      update: {
        email: payload.email ?? null,
        totalPrice: parseFloat(payload.total_price ?? '0'),
        currency: payload.currency ?? 'MXN',
        status,
        financialStatus: payload.financial_status ?? null,
        fulfillmentStatus: payload.fulfillment_status ?? null,
        rawPayload: payload,
        items: {
          deleteMany: {},
          create: items.map((item: any) => ({
            productId: item.product_id ? String(item.product_id) : null,
            name: item.title ?? 'Unnamed item',
            quantity: Number(item.quantity ?? 0),
            price: parseFloat(item.price ?? '0'),
            sku: item.sku ?? null,
          })),
        },
      },
      create: {
        shopifyId,
        email: payload.email ?? null,
        totalPrice: parseFloat(payload.total_price ?? '0'),
        currency: payload.currency ?? 'MXN',
        status,
        financialStatus: payload.financial_status ?? null,
        fulfillmentStatus: payload.fulfillment_status ?? null,
        rawPayload: payload,
        items: {
          create: items.map((item: any) => ({
            productId: item.product_id ? String(item.product_id) : null,
            name: item.title ?? 'Unnamed item',
            quantity: Number(item.quantity ?? 0),
            price: parseFloat(item.price ?? '0'),
            sku: item.sku ?? null,
          })),
        },
      },
    });
  }
}
