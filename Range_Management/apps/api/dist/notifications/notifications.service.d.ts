import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { NotificationType } from '@prisma/client';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { PushService } from './push.service';
import { EmailService } from './email.service';
export declare class NotificationsService {
    private readonly prisma;
    private readonly eventsGateway;
    private readonly pushService;
    private readonly emailService;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway, pushService: PushService, emailService: EmailService);
    getUserNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }[]>;
    markAsRead(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    deleteNotification(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
    getPreferences(userId: string): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        emailEnabled: boolean;
        pushEnabled: boolean;
        inAppEnabled: boolean;
        smsEnabled: boolean;
        disabledTypes: string[];
    }>;
    updatePreferences(userId: string, updateDto: UpdatePreferenceDto): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        emailEnabled: boolean;
        pushEnabled: boolean;
        inAppEnabled: boolean;
        smsEnabled: boolean;
        disabledTypes: string[];
    }>;
    sendNotification(userId: string, type: NotificationType, title: string, body: string, data?: any): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    } | null>;
    registerDevice(userId: string, token: string, deviceOs?: string): Promise<{
        id: string;
        createdAt: Date;
        token: string;
        userId: string;
        updatedAt: Date;
        deviceOs: string | null;
    }>;
    unregisterDevice(token: string): Promise<{
        id: string;
        createdAt: Date;
        token: string;
        userId: string;
        updatedAt: Date;
        deviceOs: string | null;
    }>;
    createNotification(data: {
        userId: string;
        type: NotificationType;
        title: string;
        body: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    } | null>;
}
