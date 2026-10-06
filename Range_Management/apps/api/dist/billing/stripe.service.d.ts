export declare class StripeService {
    private readonly logger;
    createPaymentIntent(amount: number, currency: string): Promise<{
        clientSecret: string;
        id: string;
    }>;
}
