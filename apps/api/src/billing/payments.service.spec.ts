import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPrisma = {
    payment: {
      create: jest.fn().mockResolvedValue({ id: 'pay-1', amount: 100, status: 'SUCCESS' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: StripeService, useValue: { createPaymentIntent: jest.fn().mockResolvedValue({ clientSecret: 'sec_123', paymentIntentId: 'pi_123' }) } },
        { provide: RazorpayService, useValue: { createOrder: jest.fn().mockResolvedValue({ orderId: 'order_123' }) } },
        { provide: InvoiceService, useValue: {} },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process STRIPE payments via facade', async () => {
    const result = await service.createCheckoutSession('user-1', 100, 'USD', 'STRIPE');
    expect(result.clientSecret).toBe('sec_123');
    expect(mockPrisma.payment.create).toHaveBeenCalled();
  });

  it('should process RAZORPAY payments via facade', async () => {
    const result = await service.createCheckoutSession('user-1', 100, 'INR', 'RAZORPAY');
    expect(result.orderId).toBe('order_123');
    expect(mockPrisma.payment.create).toHaveBeenCalled();
  });
});
