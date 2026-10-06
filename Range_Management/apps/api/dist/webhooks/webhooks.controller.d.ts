import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    private readonly logger;
    constructor(webhooksService: WebhooksService);
    handleElectronicTargetWebhook(signature: string, payload: any): Promise<{
        success: boolean;
    }>;
    handlePaymentWebhook(signature: string, payload: any): Promise<{
        success: boolean;
    }>;
    handleGenericWebhook(source: string, payload: any): Promise<{
        success: boolean;
    }>;
}
