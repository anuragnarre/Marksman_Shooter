import { PaymentsService } from './payments.service';
export declare class BillingController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    checkout(userId: string, amount: number, currency: string, method: string): Promise<{
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
    getDashboard(rangeId: string): Promise<{
        revenueMTD: number;
        revenueYTD: number;
        activeSubscriptions: number;
    }>;
}
