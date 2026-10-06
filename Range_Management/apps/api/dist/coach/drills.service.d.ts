import { PrismaService } from '../prisma/prisma.service';
export declare class DrillsService {
    private prisma;
    constructor(prisma: PrismaService);
    createDrill(coachId: string, data: any): Promise<{
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
    findAllPublic(): Promise<{
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
    findByCoach(coachId: string): Promise<{
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
