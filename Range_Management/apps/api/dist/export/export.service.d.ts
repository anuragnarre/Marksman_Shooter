import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class ExportService {
    private prisma;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    generateIssfScoresheet(sessionId: string): Promise<Buffer>;
    generateExcelExport(userId: string): Promise<Buffer>;
    generateShareableLink(sessionId: string): string;
}
