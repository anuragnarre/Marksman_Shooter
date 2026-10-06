import { PlanningService } from './planning.service';
export declare class PlanningController {
    private readonly planningService;
    constructor(planningService: PlanningService);
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
    saveSessionPlan(req: any, data: any): Promise<{
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
