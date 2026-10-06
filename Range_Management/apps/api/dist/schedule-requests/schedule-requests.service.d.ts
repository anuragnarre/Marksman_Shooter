import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { CreateScheduleRequestDto } from './dto/create-request.dto';
import { ResolveRequestDto } from './dto/resolve-request.dto';
export declare class ScheduleRequestsService {
    private readonly prisma;
    private readonly gateway;
    constructor(prisma: PrismaService, gateway: EventsGateway);
    createRequest(shooterId: string, dto: CreateScheduleRequestDto): Promise<{
        shooter: {
            name: string;
            email: string;
            id: string;
        };
        coach: {
            name: string;
            email: string;
            id: string;
        };
        event: {
            id: string;
            coachId: string;
            title: string;
            eventType: import(".prisma/client").$Enums.EventType;
            start: Date;
            end: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        shooterId: string;
        coachId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.RequestStatus;
        notes: string | null;
        eventId: string;
        suggestedStart: Date | null;
        suggestedEnd: Date | null;
        suggestedTitle: string | null;
        coachNote: string | null;
        resolvedAt: Date | null;
    }>;
    getRequests(userId: string, role: string): Promise<({
        shooter: {
            name: string;
            email: string;
            id: string;
        };
        coach: {
            name: string;
            email: string;
            id: string;
        };
        event: {
            id: string;
            coachId: string;
            title: string;
            eventType: import(".prisma/client").$Enums.EventType;
            start: Date;
            end: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        shooterId: string;
        coachId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.RequestStatus;
        notes: string | null;
        eventId: string;
        suggestedStart: Date | null;
        suggestedEnd: Date | null;
        suggestedTitle: string | null;
        coachNote: string | null;
        resolvedAt: Date | null;
    })[]>;
    getPendingCount(coachId: string): Promise<{
        count: number;
    }>;
    resolveRequest(coachId: string, requestId: string, dto: ResolveRequestDto): Promise<{
        shooter: {
            name: string;
            email: string;
            id: string;
        };
        coach: {
            name: string;
            email: string;
            id: string;
        };
        event: {
            id: string;
            coachId: string;
            title: string;
            eventType: import(".prisma/client").$Enums.EventType;
            start: Date;
            end: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        shooterId: string;
        coachId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.RequestStatus;
        notes: string | null;
        eventId: string;
        suggestedStart: Date | null;
        suggestedEnd: Date | null;
        suggestedTitle: string | null;
        coachNote: string | null;
        resolvedAt: Date | null;
    }>;
    cancelRequest(shooterId: string, requestId: string): Promise<{
        cancelled: boolean;
    }>;
}
