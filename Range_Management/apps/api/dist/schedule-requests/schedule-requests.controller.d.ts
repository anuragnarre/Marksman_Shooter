import { ScheduleRequestsService } from './schedule-requests.service';
import { CreateScheduleRequestDto } from './dto/create-request.dto';
import { ResolveRequestDto } from './dto/resolve-request.dto';
import { JwtPayload } from '@shooting-platform/shared-types';
export declare class ScheduleRequestsController {
    private readonly service;
    constructor(service: ScheduleRequestsService);
    create(user: JwtPayload, dto: CreateScheduleRequestDto): Promise<{
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
    getAll(user: JwtPayload): Promise<({
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
    getPendingCount(user: JwtPayload): Promise<{
        count: number;
    }>;
    resolve(user: JwtPayload, id: string, dto: ResolveRequestDto): Promise<{
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
    cancel(user: JwtPayload, id: string): Promise<{
        cancelled: boolean;
    }>;
}
