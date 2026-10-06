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
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StripeService_1.name);
        const apiKey = this.configService.get('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
        this.stripe = new stripe_1.default(apiKey, {
            apiVersion: '2024-06-20',
        });
    }
    async createCheckoutSession(params) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: params.currency.toLowerCase(),
                            product_data: {
                                name: 'Marksman Platform Purchase',
                            },
                            unit_amount: Math.round(params.amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${this.configService.get('FRONTEND_URL')}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${this.configService.get('FRONTEND_URL')}/payments/cancel`,
                client_reference_id: params.userId,
            });
            return session;
        }
        catch (error) {
            this.logger.error(`Error creating Stripe session: ${error.message}`);
            throw error;
        }
    }
    async createSubscription(params) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: params.priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                customer: params.customerId,
                success_url: `${this.configService.get('FRONTEND_URL')}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${this.configService.get('FRONTEND_URL')}/payments/cancel`,
                client_reference_id: params.userId,
            });
            return session;
        }
        catch (error) {
            this.logger.error(`Error creating Stripe subscription: ${error.message}`);
            throw error;
        }
    }
    async constructEventFromPayload(signature, payload) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || 'whsec_placeholder';
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map