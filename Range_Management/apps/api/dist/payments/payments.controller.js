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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const stripe_service_1 = require("./stripe.service");
const razorpay_service_1 = require("./razorpay.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService, stripeService, razorpayService) {
        this.paymentsService = paymentsService;
        this.stripeService = stripeService;
        this.razorpayService = razorpayService;
    }
    async checkout(data) {
        if (!data.amount || !data.currency || !data.userId) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        return this.paymentsService.createPaymentSession(data);
    }
    async stripeWebhook(signature, req) {
        if (!signature) {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        try {
            const event = await this.stripeService.constructEventFromPayload(signature, req.rawBody || req.body);
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                await this.paymentsService.handlePaymentSuccess(session.id, 'STRIPE');
            }
            return { received: true };
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook Error: ${err.message}`);
        }
    }
    async razorpayWebhook(signature, body) {
        const { razorpay_order_id, razorpay_payment_id } = body;
        const isValid = this.razorpayService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, signature);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid signature');
        }
        await this.paymentsService.handlePaymentSuccess(razorpay_order_id, 'RAZORPAY');
        return { status: 'ok' };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('webhook/stripe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('stripe-signature')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "stripeWebhook", null);
__decorate([
    (0, common_1.Post)('webhook/razorpay'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-razorpay-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "razorpayWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        stripe_service_1.StripeService,
        razorpay_service_1.RazorpayService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map