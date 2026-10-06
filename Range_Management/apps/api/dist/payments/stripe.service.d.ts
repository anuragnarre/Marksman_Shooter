import { ConfigService } from '@nestjs/config';
export declare class StripeService {
    private configService;
    private stripe;
    private readonly logger;
    constructor(configService: ConfigService);
    createCheckoutSession(params: {
        amount: number;
        currency: string;
        userId: string;
    }): Promise<import("stripe/cjs/lib").Response<import("stripe/cjs/resources/Checkout").Session>>;
    createSubscription(params: {
        priceId: string;
        userId: string;
        customerId?: string;
    }): Promise<import("stripe/cjs/lib").Response<import("stripe/cjs/resources/Checkout").Session>>;
    constructEventFromPayload(signature: string, payload: Buffer): Promise<import("stripe/cjs/resources/Events").Event>;
}
