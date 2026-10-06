import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../gateway/events.gateway';
export declare class WebhooksService {
    private prisma;
    private notificationsService;
    private eventsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, eventsGateway: EventsGateway);
    processTargetPayload(payload: any): Promise<{
        success: boolean;
    }>;
    processPaymentPayload(payload: any): Promise<{
        success: boolean;
    }>;
    processGenericPayload(source: string, payload: any): Promise<{
        success: boolean;
    }>;
}
