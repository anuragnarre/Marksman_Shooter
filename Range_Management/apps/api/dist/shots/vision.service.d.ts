import { ConfigService } from '@nestjs/config';
import { VisionShotResult } from '@shooting-platform/shared-types';
export declare class VisionService {
    private readonly configService;
    private readonly ai;
    private readonly logger;
    constructor(configService: ConfigService);
    analyzeImage(fileBuffer: Buffer, mimeType: string, targetType: string): Promise<{
        shots: VisionShotResult[];
        targetDetected: boolean;
        processingTimeMs: number;
    }>;
}
