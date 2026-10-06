import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RegisterEventDto } from './dto/register-event.dto';
import { JwtPayload } from '@shooting-platform/shared-types';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    findAllPublished(): Promise<({
        _count: {
            registrations: number;
        };
        categories: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        date: Date;
        time: string;
        location: string;
        registrationFee: number | null;
        rules: string | null;
        guidelines: string | null;
        images: string[];
        videos: string[];
        status: import(".prisma/client").$Enums.CompetitionEventStatus;
        maxParticipants: number | null;
        createdById: string;
    })[]>;
    getUpcoming(): Promise<({
        _count: {
            registrations: number;
        };
        categories: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        date: Date;
        time: string;
        location: string;
        registrationFee: number | null;
        rules: string | null;
        guidelines: string | null;
        images: string[];
        videos: string[];
        status: import(".prisma/client").$Enums.CompetitionEventStatus;
        maxParticipants: number | null;
        createdById: string;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            registrations: number;
        };
        categories: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        }[];
        registrations: ({
            user: {
                name: string;
                email: string;
                id: string;
            };
        } & {
            id: string;
            userId: string;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            eventId: string;
            categoryId: string | null;
            registeredAt: Date;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        date: Date;
        time: string;
        location: string;
        registrationFee: number | null;
        rules: string | null;
        guidelines: string | null;
        images: string[];
        videos: string[];
        status: import(".prisma/client").$Enums.CompetitionEventStatus;
        maxParticipants: number | null;
        createdById: string;
    }>;
    register(id: string, user: JwtPayload, dto: RegisterEventDto): Promise<{
        user: {
            name: string;
            email: string;
            id: string;
        };
        category: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        } | null;
    } & {
        id: string;
        userId: string;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        eventId: string;
        categoryId: string | null;
        registeredAt: Date;
    }>;
    getRegistrations(id: string): Promise<({
        user: {
            name: string;
            email: string;
            id: string;
        };
        category: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        } | null;
    } & {
        id: string;
        userId: string;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        eventId: string;
        categoryId: string | null;
        registeredAt: Date;
    })[]>;
    create(dto: CreateEventDto, user: JwtPayload): Promise<{
        categories: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        date: Date;
        time: string;
        location: string;
        registrationFee: number | null;
        rules: string | null;
        guidelines: string | null;
        images: string[];
        videos: string[];
        status: import(".prisma/client").$Enums.CompetitionEventStatus;
        maxParticipants: number | null;
        createdById: string;
    }>;
    findAll(): Promise<({
        _count: {
            registrations: number;
        };
        categories: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        date: Date;
        time: string;
        location: string;
        registrationFee: number | null;
        rules: string | null;
        guidelines: string | null;
        images: string[];
        videos: string[];
        status: import(".prisma/client").$Enums.CompetitionEventStatus;
        maxParticipants: number | null;
        createdById: string;
    })[]>;
    update(id: string, dto: UpdateEventDto): Promise<{
        _count: {
            registrations: number;
        };
        categories: {
            name: string;
            id: string;
            maxParticipants: number | null;
            eventId: string;
            fee: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        date: Date;
        time: string;
        location: string;
        registrationFee: number | null;
        rules: string | null;
        guidelines: string | null;
        images: string[];
        videos: string[];
        status: import(".prisma/client").$Enums.CompetitionEventStatus;
        maxParticipants: number | null;
        createdById: string;
    }>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
    getScoreboard(id: string): Promise<{
        id: string;
        shooterId: string;
        updatedAt: Date;
        totalScore: number;
        categoryId: string;
        competitionId: string;
        rank: number | null;
        xCount: number;
    }[]>;
    updateScoreboard(id: string, data: any): Promise<{
        id: string;
        shooterId: string;
        updatedAt: Date;
        totalScore: number;
        categoryId: string;
        competitionId: string;
        rank: number | null;
        xCount: number;
    }>;
}
