import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CoachFeedback } from '@shooting-platform/shared-types';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private server;
    constructor(jwtService: JwtService, configService: ConfigService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinSession(sessionId: string, client: Socket): void;
    handleLeaveSession(sessionId: string, client: Socket): void;
    handleJoinUserRoom(userId: string, client: Socket): void;
    handleLeaveUserRoom(userId: string, client: Socket): void;
    handleJoinLiveRange(rangeId: string, client: Socket): void;
    handleLeaveLiveRange(rangeId: string, client: Socket): void;
    emitShotDetected(rangeId: string, payload: {
        x: number;
        y: number;
        score?: number;
        pixelX?: number;
        pixelY?: number;
        targetType?: string;
        confidence?: number;
        timestamp?: number;
    }): void;
    handleJoinRangeMonitor(rangeId: string, client: Socket): void;
    handleLeaveRangeMonitor(rangeId: string, client: Socket): void;
    emitLaneStatusUpdated(rangeId: string, laneId: string, payload: any): void;
    emitSessionUpdated(sessionId: string, newShotCount: number): void;
    emitFeedbackAdded(sessionId: string, feedback: CoachFeedback): void;
    emitConnectionInvite(targetUserId: string, connectionId: string): void;
    emitConnectionAccepted(targetUserId: string, connectionId: string): void;
    emitConnectionDeclined(targetUserId: string, connectionId: string): void;
    emitScheduleRequestCreated(coachId: string, requestId: string): void;
    emitScheduleRequestResolved(shooterId: string, requestId: string, status: string): void;
    emitBiometricUpdate(userId: string, sessionId: string | null, reading: any): void;
    emitNewNotification(userId: string, payload: {
        notification: any;
        unreadCount: number;
    }): void;
    emitPbUpdated(userId: string, pbData: any): void;
    emitAchievementEarned(userId: string, achievementData: any): void;
    handleJoinCompetitionScoreboard(competitionId: string, client: Socket): void;
    handleLeaveCompetitionScoreboard(competitionId: string, client: Socket): void;
    emitCompetitionScoreboard(competitionId: string, scoreboardData: any): void;
    emitNationalRecordBroken(competitionId: string, data: any): void;
    handlePauseAndCorrect(payload: {
        targetShooterId: string;
        message: string;
    }, client: Socket): void;
}
