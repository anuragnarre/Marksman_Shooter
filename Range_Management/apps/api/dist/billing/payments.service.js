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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_service_1 = require("./stripe.service");
const razorpay_service_1 = require("./razorpay.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, stripeService, razorpayService) {
        this.prisma = prisma;
        this.stripeService = stripeService;
        this.razorpayService = razorpayService;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async createPayment(userId, amount, currency, method) {
        let integrationData = {};
        if (currency.toUpperCase() === 'INR') {
            integrationData = await this.razorpayService.createOrder(amount, currency);
        }
        else {
            integrationData = await this.stripeService.createPaymentIntent(amount, currency);
        }
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                amount,
                currency,
                status: 'PENDING',
                provider: method,
            }
        });
        return { payment, integrationData };
    }
    async getFinancialDashboard(rangeId) {
        return {
            revenueMTD: 50000,
            revenueYTD: 600000,
            activeSubscriptions: 120,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stripe_service_1.StripeService,
        razorpay_service_1.RazorpayService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map