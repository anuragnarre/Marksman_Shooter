import { JwtPayload } from '@shooting-platform/shared-types';
export declare class ParentGuardianController {
    getWeeklyDigest(user: JwtPayload): Promise<{
        message: string;
        sessionsCompleted: number;
        totalShots: number;
        averageScore: number;
    }>;
}
