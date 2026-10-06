import { PaymentsService, CreatePaymentDto } from './payments.service';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly stripeService;
    private readonly razorpayService;
    constructor(paymentsService: PaymentsService, stripeService: StripeService, razorpayService: RazorpayService);
    checkout(data: CreatePaymentDto): Promise<{
        paymentId: string;
        provider: string;
        sessionDetails: any;
    }>;
    stripeWebhook(signature: string, req: any): Promise<{
        received: boolean;
    }>;
    razorpayWebhook(signature: string, body: any): Promise<{
        status: string;
    }>;
}
