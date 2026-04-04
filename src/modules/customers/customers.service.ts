import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertFromShopify(payload: any) {
    const shopifyId = String(payload.id);

    this.logger.log(`Synchronizing customer ${shopifyId}`);

    return this.prisma.customer.upsert({
      where: { shopifyId },
      update: {
        email: payload.email ?? null,
        firstName: payload.first_name ?? null,
        lastName: payload.last_name ?? null,
        phone: payload.phone ?? null,
        state: payload.state ?? null,
        rawPayload: payload,
      },
      create: {
        shopifyId,
        email: payload.email ?? null,
        firstName: payload.first_name ?? null,
        lastName: payload.last_name ?? null,
        phone: payload.phone ?? null,
        state: payload.state ?? null,
        rawPayload: payload,
      },
    });
  }
}
