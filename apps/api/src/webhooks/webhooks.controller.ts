import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('electronic-targets')
  @HttpCode(HttpStatus.OK)
  async handleElectronicTargetWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received electronic target webhook: ${JSON.stringify(payload)}`);
    // Validation logic for signature would go here
    return this.webhooksService.processTargetPayload(payload);
  }

  @Post('payment-gateway')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received payment webhook`);
    return this.webhooksService.processPaymentPayload(payload);
  }

  @Post('generic')
  @HttpCode(HttpStatus.OK)
  async handleGenericWebhook(
    @Headers('x-source') source: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received generic webhook from ${source}`);
    return this.webhooksService.processGenericPayload(source, payload);
  }
}
