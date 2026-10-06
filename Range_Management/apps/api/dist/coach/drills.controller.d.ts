import { DrillsService } from './drills.service';
export declare class DrillsController {
    private readonly drillsService;
    constructor(drillsService: DrillsService);
    createDrill(req: any, data: any): Promise<{
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
    }>;
    getMyDrills(req: any): Promise<{
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
    getPublicDrills(): Promise<{
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
}
