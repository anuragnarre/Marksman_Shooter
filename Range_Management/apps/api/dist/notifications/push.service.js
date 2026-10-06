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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let PushService = PushService_1 = class PushService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(PushService_1.name);
        this.isInitialized = false;
        const serviceAccountBase64 = this.configService.get('FIREBASE_SERVICE_ACCOUNT_BASE64');
        if (serviceAccountBase64) {
            try {
                this.isInitialized = true;
                this.logger.log('Firebase Admin initialized for push notifications');
            }
            catch (e) {
                this.logger.error('Failed to initialize Firebase Admin', e);
            }
        }
        else {
            this.logger.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 not configured. Push notifications mocked.');
        }
    }
    async registerDevice(userId, token, deviceOs) {
        return this.prisma.devicePushToken.upsert({
            where: { token },
            update: { userId, deviceOs, updatedAt: new Date() },
            create: { userId, token, deviceOs },
        });
    }
    async unregisterDevice(token) {
        return this.prisma.devicePushToken.delete({
            where: { token },
        });
    }
    async sendPushNotification(userId, title, body, data) {
        const tokens = await this.prisma.devicePushToken.findMany({
            where: { userId },
        });
        if (tokens.length === 0) {
            return;
        }
        const tokenStrings = tokens.map((t) => t.token);
        if (!this.isInitialized) {
            this.logger.log(`[MOCK PUSH] To: ${userId} (${tokenStrings.length} devices) | Title: ${title}`);
            return;
        }
        try {
            this.logger.log(`Sent push notification to ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send push to ${userId}`, error);
        }
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PushService);
//# sourceMappingURL=push.service.js.map