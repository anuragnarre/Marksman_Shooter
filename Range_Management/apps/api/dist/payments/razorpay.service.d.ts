import { ConfigService } from '@nestjs/config';
export declare class RazorpayService {
    private configService;
    private razorpay;
    private readonly logger;
    constructor(configService: ConfigService);
    createOrder(params: {
        amount: number;
        currency: string;
        receipt: string;
    }): Promise<any>;
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
}
