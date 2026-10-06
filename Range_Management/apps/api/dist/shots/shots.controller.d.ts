import { ShotsService } from './shots.service';
import { ManualShotsDto } from './dto/manual-shots.dto';
import { UpdateShotDto } from './dto/update-shot.dto';
import { JwtPayload, Shot, VisionShotResult } from '@shooting-platform/shared-types';
export declare class ShotsController {
    private readonly shotsService;
    constructor(shotsService: ShotsService);
    importFromFile(user: JwtPayload, file: Express.Multer.File | undefined, sessionId: string, shooterId: string | undefined): Promise<Shot[]>;
    createManual(user: JwtPayload, dto: ManualShotsDto, shooterId: string | undefined): Promise<Shot[]>;
    analyzePhoto(user: JwtPayload, file: Express.Multer.File | undefined, sessionId: string, shooterId: string | undefined): Promise<Shot[]>;
    analyzePhotoFull(user: JwtPayload, file: Express.Multer.File | undefined, sessionId: string, targetType: string | undefined, shooterId: string | undefined, save?: string): Promise<{
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
    deleteShot(user: JwtPayload, shotId: string): Promise<{
        deleted: boolean;
    }>;
    updateShot(user: JwtPayload, shotId: string, dto: UpdateShotDto): Promise<Shot>;
    liveFrame(body: {
        rangeId: string;
        sessionId?: string;
        x: number;
        y: number;
        score: number;
        pixelX?: number;
        pixelY?: number;
        targetType?: string;
        confidence?: number;
        timestamp?: number;
    }, engineKey?: string): Promise<{
        saved: boolean;
        shot: Partial<Shot>;
    }>;
}
