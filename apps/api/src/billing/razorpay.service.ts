import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  async createOrder(amount: number, currency: string) {
    this.logger.log(`[Razorpay Mock] Created order for ${amount} ${currency}`);
    return { id: 'order_mock', amount, currency };
  }
}
