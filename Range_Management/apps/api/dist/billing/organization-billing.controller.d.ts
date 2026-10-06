export declare class OrganizationBillingController {
    generateConsolidatedInvoice(orgId: string, body: any): Promise<{
        success: boolean;
        orgId: string;
        invoiceId: string;
        totalUsers: any;
        totalAmount: number;
        currency: string;
        status: string;
    }>;
    getOrganizationUsers(orgId: string): Promise<{
        userId: string;
        name: string;
        status: string;
    }[]>;
}
