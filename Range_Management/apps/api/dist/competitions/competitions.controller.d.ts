import { CompetitionsService } from './competitions.service';
export declare class CompetitionsController {
    private readonly competitionsService;
    constructor(competitionsService: CompetitionsService);
    createCompetition(data: any): Promise<{
        categories: {
            id: string;
            discipline: string;
            distance: number;
            weaponType: string;
            ageCategory: string | null;
            competitionId: string;
            maxEntries: number | null;
            feeAmount: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        rangeId: string | null;
        description: string | null;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    getCompetitions(status?: string): Promise<({
        categories: {
            id: string;
            discipline: string;
            distance: number;
            weaponType: string;
            ageCategory: string | null;
            competitionId: string;
            maxEntries: number | null;
            feeAmount: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        rangeId: string | null;
        description: string | null;
        status: string;
        startDate: Date;
        endDate: Date;
    })[]>;
    getRankings(discipline: string): Promise<{
        rank: string;
        name: string;
        score: string;
        xCount: string;
        avgVel: string;
        isTop: boolean;
    }[]>;
    getActiveChallenge(): Promise<{
        title: string;
        description: string;
        target: string;
        shots: number;
        currentBest: string;
        currentLeader: string;
    }>;
    getCompetition(id: string): Promise<{
        categories: {
            id: string;
            discipline: string;
            distance: number;
            weaponType: string;
            ageCategory: string | null;
            competitionId: string;
            maxEntries: number | null;
            feeAmount: number | null;
        }[];
        entries: ({
            user: {
                name: string;
            };
            result: {
                id: string;
                updatedAt: Date;
                totalScore: number;
                rank: number | null;
                entryId: string;
                innerTens: number;
                medal: string | null;
                finalsScore: number | null;
                isFinalist: boolean;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            status: string;
            paymentId: string | null;
            categoryId: string;
            competitionId: string;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        rangeId: string | null;
        description: string | null;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    enterCompetition(id: string, categoryId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        paymentId: string | null;
        categoryId: string;
        competitionId: string;
    }>;
    coachBatchEntry(id: string, categoryId: string, shooterIds: string[], req: any): Promise<({
        userId: string;
        status: string;
        entry: {
            id: string;
            createdAt: Date;
            userId: string;
            status: string;
            paymentId: string | null;
            categoryId: string;
            competitionId: string;
        };
        reason?: undefined;
    } | {
        userId: string;
        status: string;
        reason: any;
        entry?: undefined;
    })[]>;
    getScoreboard(id: string): Promise<({
        user: {
            name: string;
        };
        result: {
            id: string;
            updatedAt: Date;
            totalScore: number;
            rank: number | null;
            entryId: string;
            innerTens: number;
            medal: string | null;
            finalsScore: number | null;
            isFinalist: boolean;
        } | null;
        category: {
            id: string;
            discipline: string;
            distance: number;
            weaponType: string;
            ageCategory: string | null;
            competitionId: string;
            maxEntries: number | null;
            feeAmount: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        paymentId: string | null;
        categoryId: string;
        competitionId: string;
    })[]>;
    finalizeCompetition(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        rangeId: string | null;
        description: string | null;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    getTrainingDelta(entryId: string): Promise<{
        competitionAverage: number;
        trainingAverage: number;
        pressureIndex: number;
        isUnderPerforming: boolean;
    }>;
}
