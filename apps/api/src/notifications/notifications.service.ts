import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { NotificationType } from '@prisma/client';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

import { PushService } from './push.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly pushService: PushService,
    private readonly emailService: EmailService,
  ) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async getPreferences(userId: string) {
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

  async updatePreferences(userId: string, updateDto: UpdatePreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: updateDto,
      create: {
        userId,
        ...updateDto,
      },
    });
  }

  // Internal method to send notification
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
  ) {
    // Check preferences
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

    // Count unread
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    // Push to websocket
    this.eventsGateway.emitNewNotification(userId, { notification, unreadCount });

    // Push to FCM/Email will be done by other services using events or injected here
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

  async registerDevice(userId: string, token: string, deviceOs?: string) {
    return this.pushService.registerDevice(userId, token, deviceOs);
  }

  async unregisterDevice(token: string) {
    return this.pushService.unregisterDevice(token);
  }

  /** @deprecated Use sendNotification() instead. This stub is kept for backward compat. */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: any;
  }) {
    return this.sendNotification(data.userId, data.type, data.title, data.body, data.metadata);
  }
}
