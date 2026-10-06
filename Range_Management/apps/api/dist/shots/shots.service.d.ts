import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { ManualShotsDto } from './dto/manual-shots.dto';
import { Shot, ShotInput, UserRole, VisionShotResult } from '@shooting-platform/shared-types';
import { UpdateShotDto } from './dto/update-shot.dto';
import { VisionService } from './vision.service';
export declare class ShotsService {
    private readonly prisma;
    private readonly eventsGateway;
    private readonly visionService;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway, visionService: VisionService);
    createShots(sessionId: string, actorId: string, actorRole: UserRole, shots: ShotInput[], shooterIdHint?: string): Promise<Shot[]>;
    importFromFile(sessionId: string, actorId: string, actorRole: UserRole, file: Express.Multer.File, shooterIdHint?: string): Promise<Shot[]>;
    createManual(dto: ManualShotsDto, actorId: string, actorRole: UserRole, shooterIdHint?: string): Promise<Shot[]>;
    analyzePhoto(sessionId: string, actorId: string, actorRole: UserRole, file: Express.Multer.File, shooterIdHint?: string): Promise<Shot[]>;
    analyzePhotoFull(sessionId: string, actorId: string, actorRole: UserRole, file: Express.Multer.File, targetType?: string, shooterIdHint?: string, persist?: boolean): Promise<{
        shots: VisionShotResult[];
        targetDetected: boolean;
        processingTimeMs: number;
        savedShots: Shot[];
        warpCenterX: number;
        warpCenterY: number;
        warpWidth: number;
        warpHeight: number;
        warpMmPerPixel: number;
    }>;
    findBySession(sessionId: string): Promise<Shot[]>;
    deleteShot(shotId: string, actorId: string, actorRole: UserRole): Promise<{
        deleted: boolean;
    }>;
    private static readonly RING_WIDTH_MM;
    processLiveFrame(payload: {
        rangeId: string;
        sessionId?: string;
        x: number;
        y: number;
        score: number;
        pixelX: number;
        pixelY: number;
        targetType: string;
        confidence?: number;
        timestamp?: number;
    }): Promise<{
        saved: boolean;
        shot: Partial<Shot>;
    }>;
    updateShot(shotId: string, actorId: string, actorRole: UserRole, dto: UpdateShotDto): Promise<Shot>;
    private assertCoachCanAccessShooter;
    private evaluatePersonalBestAndAchievements;
    private awardAchievement;
}
