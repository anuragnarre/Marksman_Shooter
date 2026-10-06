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
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
        this.logger = new common_1.Logger(WebhooksController_1.name);
    }
    async handleElectronicTargetWebhook(signature, payload) {
        this.logger.log(`Received electronic target webhook: ${JSON.stringify(payload)}`);
        return this.webhooksService.processTargetPayload(payload);
    }
    async handlePaymentWebhook(signature, payload) {
        this.logger.log(`Received payment webhook`);
        return this.webhooksService.processPaymentPayload(payload);
    }
    async handleGenericWebhook(source, payload) {
        this.logger.log(`Received generic webhook from ${source}`);
        return this.webhooksService.processGenericPayload(source, payload);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('electronic-targets'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-webhook-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleElectronicTargetWebhook", null);
__decorate([
    (0, common_1.Post)('payment-gateway'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('stripe-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handlePaymentWebhook", null);
__decorate([
    (0, common_1.Post)('generic'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-source')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleGenericWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map