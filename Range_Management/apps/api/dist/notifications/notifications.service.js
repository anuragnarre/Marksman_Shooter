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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../gateway/events.gateway");
const push_service_1 = require("./push.service");
const email_service_1 = require("./email.service");
let NotificationsService = class NotificationsService {
    constructor(prisma, eventsGateway, pushService, emailService) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.pushService = pushService;
        this.emailService = emailService;
    }
    async getUserNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async markAsRead(id, userId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification || notification.userId !== userId) {
            throw new common_1.NotFoundException(`Notification ${id} not found`);
        }
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async deleteNotification(id, userId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification || notification.userId !== userId) {
            throw new common_1.NotFoundException(`Notification ${id} not found`);
        }
        return this.prisma.notification.delete({
            where: { id },
        });
    }
    async getPreferences(userId) {
        let prefs = await this.prisma.notificationPreference.findUnique({
            where: { userId },
        });
        if (!prefs) {
            prefs = await this.prisma.notificationPreference.create({
                data: { userId },
            });
        }
        return prefs;
    }
    async updatePreferences(userId, updateDto) {
        return this.prisma.notificationPreference.upsert({
            where: { userId },
            update: updateDto,
            create: {
                userId,
                ...updateDto,
            },
        });
    }
    async sendNotification(userId, type, title, body, data) {
        const prefs = await this.getPreferences(userId);
        if (!prefs.inAppEnabled || prefs.disabledTypes.includes(type)) {
            return null;
        }
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                body,
                data: data || {},
            },
        });
        const unreadCount = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });
        this.eventsGateway.emitNewNotification(userId, { notification, unreadCount });
        if (prefs.pushEnabled) {
            await this.pushService.sendPushNotification(userId, title, body, data);
        }
        if (prefs.emailEnabled) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user?.email) {
                await this.emailService.sendEmail(user.email, title, body);
            }
        }
        return notification;
    }
    async registerDevice(userId, token, deviceOs) {
        return this.pushService.registerDevice(userId, token, deviceOs);
    }
    async unregisterDevice(token) {
        return this.pushService.unregisterDevice(token);
    }
    async createNotification(data) {
        return this.sendNotification(data.userId, data.type, data.title, data.body, data.metadata);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway,
        push_service_1.PushService,
        email_service_1.EmailService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map