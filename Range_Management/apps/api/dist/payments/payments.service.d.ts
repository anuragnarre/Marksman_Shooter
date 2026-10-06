import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma/prisma.service';
export interface CreatePaymentDto {
    userId: string;
    amount: number;
    currency: string;
    relatedType?: string;
    relatedId?: string;
    promoCode?: string;
}
export declare class PaymentsService {
    private stripeService;
    private razorpayService;
    private invoiceService;
    private prisma;
    constructor(stripeService: StripeService, razorpayService: RazorpayService, invoiceService: InvoiceService, prisma: PrismaService);
    createPaymentSession(data: CreatePaymentDto): Promise<{
        paymentId: string;
        provider: string;
        sessionDetails: any;
    }>;
    handlePaymentSuccess(transactionId: string, provider: 'STRIPE' | 'RAZORPAY'): Promise<void>;
}
