import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';
export declare class AnnouncementService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createAnnouncement(rangeId: string, createdById: string, dto: CreateAnnouncementDto): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        createdById: string;
        isActive: boolean;
        type: string;
        body: string;
        startsAt: Date | null;
        endsAt: Date | null;
    }>;
    getActiveAnnouncements(rangeId: string): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        createdById: string;
        isActive: boolean;
        type: string;
        body: string;
        startsAt: Date | null;
        endsAt: Date | null;
    }[]>;
    deactivateAnnouncement(announcementId: string, rangeId: string): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        createdById: string;
        isActive: boolean;
        type: string;
        body: string;
        startsAt: Date | null;
        endsAt: Date | null;
    }>;
    deactivateExpired(): Promise<void>;
}
