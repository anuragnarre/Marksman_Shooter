import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
export declare class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly prisma;
    server: Server;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleTargetHit(data: any, client: Socket): Promise<{
        event: string;
        data: {
            id: string;
            sessionId: string;
            shotNumber: number;
            score: number;
            x: number;
            y: number;
            timestamp: Date;
        };
    } | undefined>;
    handleSubscribeRange(data: {
        rangeId: string;
    }, client: Socket): void;
    handleCeaseFire(data: {
        rangeId: string;
        laneId?: string;
        reason: string;
    }, client: Socket): Promise<void>;
}
