import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { SubscriptionService } from './subscription.service.js';

@Controller('webhooks')
@SkipThrottle()
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('paddle')
  @HttpCode(HttpStatus.OK)
  async handlePaddleWebhook(
    @Req() req: Request,
    @Headers('paddle-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Paddle-Signature header');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    await this.subscriptionService.handleWebhookEvent(
      rawBody.toString('utf-8'),
      signature,
    );

    return { received: true };
  }
}
