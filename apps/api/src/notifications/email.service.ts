import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiKey: string | undefined;

  constructor(private configService: ConfigService) {
    // Determine provider (SendGrid or Resend)
    this.apiKey = this.configService.get<string>('EMAIL_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('EMAIL_API_KEY not configured. Emails will be mocked.');
    }
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    if (!this.apiKey) {
      this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      // Logic for sending email via configured provider
      this.logger.log(`Sending email to ${to} | Subject: ${subject}`);
      // Implementation omitted depending on provider (e.g. resend.emails.send)
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }

  async sendBookingConfirmation(email: string, bookingRef: string, date: string) {
    const content = `<h1>Booking Confirmed</h1><p>Your booking <b>${bookingRef}</b> on ${date} is confirmed.</p>`;
    return this.sendEmail(email, `Booking Confirmation: ${bookingRef}`, content);
  }

  async sendMembershipReminder(email: string, daysLeft: number) {
    const content = `<p>Your membership expires in ${daysLeft} days. Please renew to keep your access.</p>`;
    return this.sendEmail(email, 'Membership Expiring Soon', content);
  }
}
