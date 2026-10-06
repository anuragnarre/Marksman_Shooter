import { NotificationsService } from '../notifications/notifications.service';
export declare class RsoController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    declareColdRange(rangeId: string): Promise<{
        message: string;
        status: string;
    }>;
    scanQrCode(qrPayload: string): Promise<{
        valid: boolean;
        shooterId: string;
    }>;
}
