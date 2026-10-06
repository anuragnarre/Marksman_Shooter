import { BallisticsService } from './ballistics.service';
import { CreateBallisticsDto } from './dto/create-ballistics.dto';
export declare class BallisticsController {
    private readonly ballisticsService;
    constructor(ballisticsService: BallisticsService);
    findAll(req: any): import(".prisma/client").Prisma.PrismaPromise<{
        name: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        equipmentId: string | null;
        muzzleVelocityFps: number;
        pelletWeightGrains: number;
        ballisticCoef: number;
        sightHeightInches: number;
        zeroRangeYards: number;
    }[]>;
    calculate(req: any, dto: CreateBallisticsDto): Promise<{
        profile: {
            name: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            equipmentId: string | null;
            muzzleVelocityFps: number;
            pelletWeightGrains: number;
            ballisticCoef: number;
            sightHeightInches: number;
            zeroRangeYards: number;
        };
        trajectory: {
            range: number;
            drop: number;
            vel: number;
            ke: number;
        }[];
    }>;
    remove(id: string, req: any): import(".prisma/client").Prisma.Prisma__BallisticProfileClient<{
        name: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        equipmentId: string | null;
        muzzleVelocityFps: number;
        pelletWeightGrains: number;
        ballisticCoef: number;
        sightHeightInches: number;
        zeroRangeYards: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
