import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly stripeService;
    private readonly razorpayService;
    private readonly logger;
    constructor(prisma: PrismaService, stripeService: StripeService, razorpayService: RazorpayService);
    createPayment(userId: string, amount: number, currency: string, method: string): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            status: string;
            amount: number;
            currency: string;
            provider: string;
            transactionId: string | null;
            relatedType: string | null;
            relatedId: string | null;
        };
        integrationData: {};
    }>;
    getFinancialDashboard(rangeId: string): Promise<{
        revenueMTD: number;
        revenueYTD: number;
        activeSubscriptions: number;
    }>;
}
