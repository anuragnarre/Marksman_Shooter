import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private apiKey;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, htmlContent: string): Promise<void>;
    sendBookingConfirmation(email: string, bookingRef: string, date: string): Promise<void>;
    sendMembershipReminder(email: string, daysLeft: number): Promise<void>;
}
