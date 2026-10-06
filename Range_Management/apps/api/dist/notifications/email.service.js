"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.apiKey = this.configService.get('EMAIL_API_KEY');
        if (!this.apiKey) {
            this.logger.warn('EMAIL_API_KEY not configured. Emails will be mocked.');
        }
    }
    async sendEmail(to, subject, htmlContent) {
        if (!this.apiKey) {
            this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            return;
        }
        try {
            this.logger.log(`Sending email to ${to} | Subject: ${subject}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
        }
    }
    async sendBookingConfirmation(email, bookingRef, date) {
        const content = `<h1>Booking Confirmed</h1><p>Your booking <b>${bookingRef}</b> on ${date} is confirmed.</p>`;
        return this.sendEmail(email, `Booking Confirmation: ${bookingRef}`, content);
    }
    async sendMembershipReminder(email, daysLeft) {
        const content = `<p>Your membership expires in ${daysLeft} days. Please renew to keep your access.</p>`;
        return this.sendEmail(email, 'Membership Expiring Soon', content);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map