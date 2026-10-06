import { PrismaService } from '../prisma/prisma.service';
export declare class PlanningService {
    private prisma;
    constructor(prisma: PrismaService);
    getDrills(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        discipline: string | null;
        distance: string | null;
        coachId: string;
        description: string | null;
        isPublic: boolean;
        tags: string[];
        category: string;
        timeLimit: number | null;
        rounds: number | null;
        difficultyLevel: string;
    }[]>;
    saveSessionPlan(userId: string, data: any): Promise<{
        id: string;
        userId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        weekStart: Date;
        generatedAt: Date;
        focusAreas: string[];
    }>;
    getSessionPlan(shooterId: string): Promise<{
        id: string;
        userId: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        weekStart: Date;
        generatedAt: Date;
        focusAreas: string[];
    } | null>;
}
