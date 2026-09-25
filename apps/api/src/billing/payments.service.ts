import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly razorpayService: RazorpayService,
  ) {}

  async createPayment(userId: string, amount: number, currency: string, method: string) {
    let integrationData = {};

    if (currency.toUpperCase() === 'INR') {
      integrationData = await this.razorpayService.createOrder(amount, currency);
    } else {
      integrationData = await this.stripeService.createPaymentIntent(amount, currency);
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        currency,
        status: 'PENDING',
        provider: method,
      }
    });

    return { payment, integrationData };
  }

  async getFinancialDashboard(rangeId: string) {
    // Mock KPIs for the dashboard
    return {
      revenueMTD: 50000,
      revenueYTD: 600000,
      activeSubscriptions: 120,
    };
  }
}
