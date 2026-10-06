import { CoachService } from './coach.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { InviteShooterDto } from './dto/invite-shooter.dto';
import { CreateManagedShooterDto } from './dto/create-managed-shooter.dto';
import { UpdateManagedShooterDto } from './dto/update-managed-shooter.dto';
import { CreateManagedShotsDto } from './dto/create-managed-shots.dto';
import { CreateSessionDto } from '../sessions/dto/create-session.dto';
import { CoachDashboardData, CoachShooterPerformanceSummary, CoachConnection, CoachFeedback, JwtPayload, Session, Shot, User } from '@shooting-platform/shared-types';
export declare class CoachController {
    private readonly coachService;
    constructor(coachService: CoachService);
    requestConnection(user: JwtPayload, dto: CreateConnectionDto): Promise<CoachConnection>;
    approveConnection(user: JwtPayload, connectionId: string): Promise<CoachConnection>;
    rejectConnection(user: JwtPayload, connectionId: string): Promise<CoachConnection>;
    getPendingRequests(user: JwtPayload): Promise<CoachConnection[]>;
    searchShooter(email: string): Promise<User | null>;
    inviteShooter(user: JwtPayload, dto: InviteShooterDto): Promise<CoachConnection>;
    getOutgoingInvites(user: JwtPayload): Promise<CoachConnection[]>;
    cancelInvite(user: JwtPayload, connectionId: string): Promise<void>;
    getIncomingInvites(user: JwtPayload): Promise<CoachConnection[]>;
    approveInvite(user: JwtPayload, connectionId: string): Promise<CoachConnection>;
    rejectInvite(user: JwtPayload, connectionId: string): Promise<CoachConnection>;
    getAvailableCoaches(): Promise<User[]>;
    getMyConnections(user: JwtPayload): Promise<CoachConnection[]>;
    getMyShooters(user: JwtPayload): Promise<User[]>;
    getDashboard(user: JwtPayload): Promise<CoachDashboardData>;
    getManagedShooterProfiles(user: JwtPayload): Promise<User[]>;
    createManagedShooterProfile(user: JwtPayload, dto: CreateManagedShooterDto): Promise<User>;
    updateManagedShooterProfile(user: JwtPayload, shooterId: string, dto: UpdateManagedShooterDto): Promise<User>;
    getShooterSessions(user: JwtPayload, shooterId: string): Promise<Session[]>;
    createManagedShooterSession(user: JwtPayload, shooterId: string, dto: CreateSessionDto): Promise<Session>;
    addManagedShooterSessionShots(user: JwtPayload, shooterId: string, sessionId: string, dto: CreateManagedShotsDto): Promise<Shot[]>;
    removeManagedShooterSession(user: JwtPayload, shooterId: string, sessionId: string): Promise<void>;
    getShooterPerformanceSummary(user: JwtPayload, shooterId: string): Promise<CoachShooterPerformanceSummary>;
    addFeedback(user: JwtPayload, dto: CreateFeedbackDto): Promise<CoachFeedback>;
    getCoachDirectory(): Promise<{
        coachProfile: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            bio: string | null;
            specializations: string[];
            hourlyRate: number | null;
            availability: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        id: string;
        name: string;
        email: string;
        role: import("@shooting-platform/shared-types").UserRole;
        googleId?: string | null;
        hasPassword?: boolean;
        hasGoogle?: boolean;
        createdAt: Date;
        shooterProfile?: import("@shooting-platform/shared-types").ShooterProfile | null;
    }[]>;
    getSquadPerformance(squadId: string, user: JwtPayload): Promise<{
        squadId: string;
        name: string;
        performance: {
            userId: string;
            name: string;
            email: string;
            summary: CoachShooterPerformanceSummary;
        }[];
    }>;
    createGroupSession(user: JwtPayload, data: any): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        notes: string | null;
        squadId: string;
    }>;
}
