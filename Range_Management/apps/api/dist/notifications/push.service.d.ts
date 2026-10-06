import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class PushService {
    private prisma;
    private configService;
    private readonly logger;
    private isInitialized;
    constructor(prisma: PrismaService, configService: ConfigService);
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
    sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
}
