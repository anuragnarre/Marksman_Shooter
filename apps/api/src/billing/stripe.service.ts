import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  async createPaymentIntent(amount: number, currency: string) {
    this.logger.log(`[Stripe Mock] Created intent for ${amount} ${currency}`);
    return { clientSecret: 'mock_stripe_secret', id: 'pi_mock' };
  }
}
