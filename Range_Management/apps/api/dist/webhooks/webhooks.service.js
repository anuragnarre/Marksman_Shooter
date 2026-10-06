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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const events_gateway_1 = require("../gateway/events.gateway");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(prisma, notificationsService, eventsGateway) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.eventsGateway = eventsGateway;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async processTargetPayload(payload) {
        try {
            const { targetId, score, x, y } = payload;
            this.eventsGateway.emitShotDetected("default-range", { laneId: targetId, score, x, y, timestamp: new Date() });
            this.logger.log(`Processed electronic target payload: Target ${targetId} scored ${score}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error('Error processing target payload', error);
            throw error;
        }
    }
    async processPaymentPayload(payload) {
        try {
            const { type, data } = payload;
            if (type === 'payment_intent.succeeded') {
                const amount = data.object.amount;
                const customerEmail = data.object.receipt_email;
                this.logger.log(`Payment succeeded for ${customerEmail}: ${amount}`);
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error('Error processing payment payload', error);
            throw error;
        }
    }
    async processGenericPayload(source, payload) {
        this.logger.log(`Processed generic payload from ${source}`);
        return { success: true };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        events_gateway_1.EventsGateway])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map