import { PrismaService } from '../prisma/prisma.service';
export declare class BallisticsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): import(".prisma/client").Prisma.PrismaPromise<{
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
    calculate(userId: string, dto: any): Promise<{
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
    remove(id: string, userId: string): import(".prisma/client").Prisma.Prisma__BallisticProfileClient<{
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
