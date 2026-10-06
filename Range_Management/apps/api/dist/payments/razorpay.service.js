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
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Razorpay = require("razorpay");
const crypto = require("crypto");
let RazorpayService = RazorpayService_1 = class RazorpayService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RazorpayService_1.name);
        const key_id = this.configService.get('RAZORPAY_KEY_ID') || 'rzp_test_placeholder';
        const key_secret = this.configService.get('RAZORPAY_KEY_SECRET') || 'secret_placeholder';
        this.razorpay = new Razorpay({
            key_id,
            key_secret,
        });
    }
    async createOrder(params) {
        try {
            const options = {
                amount: Math.round(params.amount * 100),
                currency: params.currency,
                receipt: params.receipt,
            };
            const order = await this.razorpay.orders.create(options);
            return order;
        }
        catch (error) {
            this.logger.error(`Error creating Razorpay order: ${error.message}`);
            throw error;
        }
    }
    verifyPaymentSignature(orderId, paymentId, signature) {
        const key_secret = this.configService.get('RAZORPAY_KEY_SECRET') || 'secret_placeholder';
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', key_secret)
            .update(body.toString())
            .digest('hex');
        return expectedSignature === signature;
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map