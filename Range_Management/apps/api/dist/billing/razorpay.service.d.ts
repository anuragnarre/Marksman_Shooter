export declare class RazorpayService {
    private readonly logger;
    createOrder(amount: number, currency: string): Promise<{
        id: string;
        amount: number;
        currency: string;
    }>;
}
