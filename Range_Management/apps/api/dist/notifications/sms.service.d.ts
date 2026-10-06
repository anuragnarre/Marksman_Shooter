export declare class SmsService {
    private readonly logger;
    sendSms(phoneNumber: string, message: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
    sendWhatsApp(phoneNumber: string, message: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
