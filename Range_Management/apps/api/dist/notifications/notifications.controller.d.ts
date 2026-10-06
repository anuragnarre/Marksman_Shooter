import { NotificationsService } from './notifications.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getUserNotifications(req: any): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }[]>;
    markAllAsRead(req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAsRead(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
    deleteNotification(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
    getPreferences(req: any): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        emailEnabled: boolean;
        pushEnabled: boolean;
        inAppEnabled: boolean;
        smsEnabled: boolean;
        disabledTypes: string[];
    }>;
    updatePreferences(updateDto: UpdatePreferenceDto, req: any): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        emailEnabled: boolean;
        pushEnabled: boolean;
        inAppEnabled: boolean;
        smsEnabled: boolean;
        disabledTypes: string[];
    }>;
    registerDevice(token: string, deviceOs: string, req: any): Promise<{
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
}
