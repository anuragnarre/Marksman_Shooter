import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtPayload } from '@shooting-platform/shared-types';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getEvents(user: JwtPayload, start: string, end: string): Promise<({
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
    createEvent(user: JwtPayload, dto: CreateEventDto): Promise<({
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
    updateEvent(user: JwtPayload, id: string, dto: UpdateEventDto): Promise<{
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
    deleteEvent(user: JwtPayload, id: string): Promise<{
        deleted: boolean;
    }>;
    deleteRecurring(user: JwtPayload, groupId: string): Promise<{
        deleted: boolean;
    }>;
    getShooters(user: JwtPayload): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: Date;
    }[]>;
}
