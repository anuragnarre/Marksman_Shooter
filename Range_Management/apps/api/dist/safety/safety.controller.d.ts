import { SafetyService } from './safety.service';
export declare class SafetyController {
    private readonly safetyService;
    constructor(safetyService: SafetyService);
    createIncidentReport(data: any): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        description: string;
        status: string;
        type: string;
        laneId: string | null;
        reporterId: string;
        incidentDate: Date;
        severity: string;
    }>;
    getAllIncidents(): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        description: string;
        status: string;
        type: string;
        laneId: string | null;
        reporterId: string;
        incidentDate: Date;
        severity: string;
    }[]>;
    getIncidentById(id: string): Promise<({
        IncidentPhoto: {
            id: string;
            incidentId: string;
            photoUrl: string;
            uploadedAt: Date;
        }[];
        CorrectiveAction: {
            id: string;
            description: string;
            status: string;
            assignedToId: string;
            incidentId: string;
            dueDate: Date | null;
            completedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        rangeId: string;
        description: string;
        status: string;
        type: string;
        laneId: string | null;
        reporterId: string;
        incidentDate: Date;
        severity: string;
    }) | null>;
    updateIncidentStatus(id: string, status: any): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        description: string;
        status: string;
        type: string;
        laneId: string | null;
        reporterId: string;
        incidentDate: Date;
        severity: string;
    }>;
    uploadIncidentPhoto(id: string, photoUrl: string): Promise<{
        id: string;
        incidentId: string;
        photoUrl: string;
        uploadedAt: Date;
    }>;
    acknowledgeSafety(userId: string, rangeId: string): Promise<{
        id: string;
        userId: string;
        rangeId: string;
        acknowledgedAt: Date;
        version: number;
    }>;
    checkSafetyAcknowledgment(userId: string, rangeId: string): Promise<{
        id: string;
        userId: string;
        rangeId: string;
        acknowledgedAt: Date;
        version: number;
    } | null>;
    createQuiz(rangeId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        passingScore: number;
    }>;
    getQuizzes(rangeId: string): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        passingScore: number;
    }[]>;
    submitQuizAttempt(userId: string, quizId: string, score: number): Promise<{
        id: string;
        userId: string;
        score: number;
        passed: boolean;
        attemptedAt: Date;
        quizId: string;
    }>;
    getFirstAidKits(rangeId: string): Promise<{
        id: string;
        rangeId: string;
        location: string;
        status: string;
        notes: string | null;
        lastChecked: Date;
    }[]>;
    updateFirstAidKit(id: string, data: any): Promise<{
        id: string;
        rangeId: string;
        location: string;
        status: string;
        notes: string | null;
        lastChecked: Date;
    }>;
    getAuditLogs(rangeId?: string): Promise<{
        id: string;
        userId: string;
        timestamp: Date;
        action: string;
        resourceType: string;
        resourceId: string;
        beforeData: import("@prisma/client/runtime/library").JsonValue | null;
        afterData: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
}
