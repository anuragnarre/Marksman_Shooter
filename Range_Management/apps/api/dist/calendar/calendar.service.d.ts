import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class CalendarService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private isSelfManagedEvent;
    private safeDate;
    getCoachEvents(coachId: string, start: string, end: string): Promise<({
        assignees: ({
            shooter: {
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            shooterId: string;
            status: string;
            eventId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        coachId: string;
        title: string;
        description: string | null;
        eventType: import(".prisma/client").$Enums.EventType;
        start: Date;
        end: Date;
        allDay: boolean;
        color: string | null;
        recurringGroupId: string | null;
        updatedAt: Date;
    })[]>;
    getShooterEvents(shooterId: string, start: string, end: string): Promise<{
        assigneeStatus: string;
        assignees: ({
            shooter: {
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            shooterId: string;
            status: string;
            eventId: string;
        })[];
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        coachId: string;
        title: string;
        description: string | null;
        eventType: import(".prisma/client").$Enums.EventType;
        start: Date;
        end: Date;
        allDay: boolean;
        color: string | null;
        recurringGroupId: string | null;
        updatedAt: Date;
    }[]>;
    createEvent(actorId: string, actorRole: string, dto: CreateEventDto): Promise<({
        assignees: ({
            shooter: {
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            shooterId: string;
            status: string;
            eventId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        coachId: string;
        title: string;
        description: string | null;
        eventType: import(".prisma/client").$Enums.EventType;
        start: Date;
        end: Date;
        allDay: boolean;
        color: string | null;
        recurringGroupId: string | null;
        updatedAt: Date;
    })[]>;
    updateEvent(actorId: string, actorRole: string, eventId: string, dto: UpdateEventDto): Promise<{
        assignees: ({
            shooter: {
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            shooterId: string;
            status: string;
            eventId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        coachId: string;
        title: string;
        description: string | null;
        eventType: import(".prisma/client").$Enums.EventType;
        start: Date;
        end: Date;
        allDay: boolean;
        color: string | null;
        recurringGroupId: string | null;
        updatedAt: Date;
    }>;
    deleteEvent(actorId: string, actorRole: string, eventId: string): Promise<{
        deleted: boolean;
    }>;
    deleteRecurringGroup(actorId: string, actorRole: string, groupId: string): Promise<{
        deleted: boolean;
    }>;
    getConnectedShooters(coachId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: Date;
    }[]>;
    private expandDates;
    private assertCoachCanAssignShooters;
}
