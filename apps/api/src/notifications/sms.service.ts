import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSms(phoneNumber: string, message: string) {
    this.logger.log(`Mock sending SMS to ${phoneNumber}: ${message}`);
    return { success: true, messageId: 'mock-sms-id' };
  }

  async sendWhatsApp(phoneNumber: string, message: string) {
    this.logger.log(`Mock sending WhatsApp to ${phoneNumber}: ${message}`);
    return { success: true, messageId: 'mock-wa-id' };
  }
}
