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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const stripe_service_1 = require("./stripe.service");
const razorpay_service_1 = require("./razorpay.service");
const invoice_service_1 = require("./invoice.service");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsService = class PaymentsService {
    constructor(stripeService, razorpayService, invoiceService, prisma) {
        this.stripeService = stripeService;
        this.razorpayService = razorpayService;
        this.invoiceService = invoiceService;
        this.prisma = prisma;
    }
    async createPaymentSession(data) {
        let finalAmount = data.amount;
        if (data.promoCode) {
            const promo = await this.prisma.promoCode.findUnique({
                where: { code: data.promoCode }
            });
            if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt < new Date()) || (promo.maxUses && promo.usedCount >= promo.maxUses)) {
                throw new common_1.BadRequestException('Invalid or expired promo code');
            }
            if (promo.discountType === 'PERCENTAGE') {
                finalAmount = finalAmount - (finalAmount * (promo.discountValue / 100));
            }
            else if (promo.discountType === 'FIXED') {
                finalAmount = Math.max(0, finalAmount - promo.discountValue);
            }
            await this.prisma.promoCode.update({
                where: { id: promo.id },
                data: { usedCount: { increment: 1 } }
            });
        }
        const currency = data.currency.toUpperCase();
        let providerResponse;
        let providerName;
        if (currency === 'INR') {
            providerName = 'RAZORPAY';
            providerResponse = await this.razorpayService.createOrder({
                amount: finalAmount,
                currency,
                receipt: `receipt_${Date.now()}`
            });
        }
        else {
            providerName = 'STRIPE';
            providerResponse = await this.stripeService.createCheckoutSession({
                amount: finalAmount,
                currency,
                userId: data.userId,
            });
        }
        const payment = await this.prisma.payment.create({
            data: {
                userId: data.userId,
                amount: finalAmount,
                currency,
                provider: providerName,
                transactionId: providerResponse.id || null,
                status: 'PENDING',
                relatedType: data.relatedType,
                relatedId: data.relatedId,
            }
        });
        return {
            paymentId: payment.id,
            provider: providerName,
            sessionDetails: providerResponse,
        };
    }
    async handlePaymentSuccess(transactionId, provider) {
        const payment = await this.prisma.payment.findUnique({
            where: { transactionId },
            include: { user: true }
        });
        if (!payment)
            return;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCESS' }
        });
        if (payment.relatedType === 'COACHING_PACKAGE' && payment.relatedId) {
            const pkg = await this.prisma.coachingPackage.findUnique({ where: { id: payment.relatedId } });
            if (pkg) {
                await this.prisma.coachingPackagePurchase.create({
                    data: {
                        userId: payment.userId,
                        packageId: pkg.id,
                        remainingSessions: pkg.sessionsCount,
                        paymentId: payment.id,
                    }
                });
            }
        }
        await this.invoiceService.generateAndSendInvoice(payment);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stripe_service_1.StripeService,
        razorpay_service_1.RazorpayService,
        invoice_service_1.InvoiceService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map