import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      service: 'shopify-webhooks-backend-nest',
      timestamp: new Date().toISOString(),
    };
  }
}