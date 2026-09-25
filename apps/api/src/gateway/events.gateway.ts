// apps/api/src/gateway/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  CoachFeedback,
  ConnectionNotificationEvent,
  FeedbackAddedEvent,
  SessionUpdatedEvent,
  BiometricUpdateEvent,
  BiometricReading,
} from '@shooting-platform/shared-types';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Verify JWT on every new WebSocket connection. Disconnect if invalid. */
  handleConnection(client: Socket): void {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');
      if (!token) throw new WsException('No token provided');
      const secret = this.configService.get<string>('JWT_SECRET') ?? '';
      const payload = this.jwtService.verify(token, { secret });
      // Attach verified userId to socket data for use in message handlers
      (client.data as any).userId = payload.sub as string;
      console.log(`WS authenticated: ${client.id} userId=${payload.sub}`);
    } catch {
      console.warn(`WS rejected unauthenticated client: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    console.log(`WS client disconnected: ${client.id}`);
  }

  /**
   * Client emits 'joinSession' with sessionId to subscribe to session events.
   */
  @SubscribeMessage('joinSession')
  handleJoinSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!sessionId || typeof sessionId !== 'string') return;
    void client.join(sessionId);
    client.emit('joinedSession', { sessionId });
  }

  @SubscribeMessage('leaveSession')
  handleLeaveSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    void client.leave(sessionId);
  }

  /**
   * Client emits 'joinUserRoom' with their userId to receive personal notifications
   * (connection invites, approvals, rejections).
   */
  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    // SEC-02: Only allow a user to join their own personal room (verified from JWT)
    const authenticatedUserId = (client.data as any).userId as string | undefined;
    if (!userId || typeof userId !== 'string') return;
    if (authenticatedUserId && authenticatedUserId !== userId) {
      client.emit("error", { message: "Forbidden: cannot join another user's room" });
      return;
    }
    void client.join(`user:${userId}`);
    client.emit('joinedUserRoom', { userId });
  }

  @SubscribeMessage('leaveUserRoom')
  handleLeaveUserRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    void client.leave(`user:${userId}`);
  }

  // ── Live Range events ───────────────────────────────────────────────────

  @SubscribeMessage('joinLiveRange')
  handleJoinLiveRange(
    @MessageBody() rangeId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!rangeId || typeof rangeId !== 'string') return;
    void client.join(`live_range:${rangeId}`);
    client.emit('joinedLiveRange', { rangeId });
  }

  @SubscribeMessage('leaveLiveRange')
  handleLeaveLiveRange(
    @MessageBody() rangeId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    void client.leave(`live_range:${rangeId}`);
  }

  emitShotDetected(rangeId: string, payload: {
    x: number;
    y: number;
    score?: number;
    pixelX?: number;
    pixelY?: number;
    targetType?: string;
    confidence?: number;
    timestamp?: number;
  }): void {
    this.server.to(`live_range:${rangeId}`).emit('shot_detected', payload);
  }

  // ── Range Monitor events (V2) ──────────────────────────────────────────

  @SubscribeMessage('joinRangeMonitor')
  handleJoinRangeMonitor(
    @MessageBody() rangeId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!rangeId || typeof rangeId !== 'string') return;
    void client.join(`range_monitor:${rangeId}`);
    client.emit('joinedRangeMonitor', { rangeId });
  }

  @SubscribeMessage('leaveRangeMonitor')
  handleLeaveRangeMonitor(
    @MessageBody() rangeId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    void client.leave(`range_monitor:${rangeId}`);
  }

  emitLaneStatusUpdated(rangeId: string, laneId: string, payload: any): void {
    this.server.to(`range_monitor:${rangeId}`).emit('lane_status_updated', { laneId, ...payload });
  }

  // ── Session events ────────────────────────────────────────────────────────

  emitSessionUpdated(sessionId: string, newShotCount: number): void {
    const event: SessionUpdatedEvent = { sessionId, newShotCount };
    this.server.to(sessionId).emit('session.updated', event);
  }

  emitFeedbackAdded(sessionId: string, feedback: CoachFeedback): void {
    const event: FeedbackAddedEvent = { sessionId, feedback };
    this.server.to(sessionId).emit('feedback.added', event);
  }

  // ── Connection events — emitted to user:<userId> rooms ────────────────────

  /**
   * Notify a user that they received a new connection request/invite.
   * Used when:
   *   - Shooter sends request to coach → emitted to coach's user room
   *   - Coach sends invite to shooter  → emitted to shooter's user room
   */
  emitConnectionInvite(targetUserId: string, connectionId: string): void {
    const event: ConnectionNotificationEvent = { connectionId };
    this.server.to(`user:${targetUserId}`).emit('connection.invite', event);
  }

  /**
   * Notify a user that their outgoing request was accepted.
   */
  emitConnectionAccepted(targetUserId: string, connectionId: string): void {
    const event: ConnectionNotificationEvent = { connectionId };
    this.server.to(`user:${targetUserId}`).emit('connection.accepted', event);
  }

  /**
   * Notify a user that their outgoing request was declined.
   */
  emitConnectionDeclined(targetUserId: string, connectionId: string): void {
    const event: ConnectionNotificationEvent = { connectionId };
    this.server.to(`user:${targetUserId}`).emit('connection.declined', event);
  }

  /** Notify coach of a new schedule change request from a shooter */
  emitScheduleRequestCreated(coachId: string, requestId: string): void {
    this.server.to(`user:${coachId}`).emit('schedule.request.created', { requestId });
  }

  /** Notify shooter that their request was resolved (approved/rejected) */
  emitScheduleRequestResolved(shooterId: string, requestId: string, status: string): void {
    this.server.to(`user:${shooterId}`).emit('schedule.request.resolved', { requestId, status });
  }

  // ── Biometric events ─────────────────────────────────────────────────────

  emitBiometricUpdate(userId: string, sessionId: string | null, reading: any): void {
    const event: BiometricUpdateEvent = { userId, sessionId, reading };
    this.server.to(`user:${userId}`).emit('biometric.update', event);
    if (sessionId) {
      this.server.to(sessionId).emit('biometric.update', event);
    }
  }

  // ── Notification events ──────────────────────────────────────────────────

  emitNewNotification(userId: string, payload: { notification: any; unreadCount: number }): void {
    this.server.to(`user:${userId}`).emit('notification:new', payload);
  }

  // ── Player / Shooter events ───────────────────────────────────────────────

  emitPbUpdated(userId: string, pbData: any): void {
    this.server.to(`user:${userId}`).emit('pb:updated', pbData);
  }

  emitAchievementEarned(userId: string, achievementData: any): void {
    this.server.to(`user:${userId}`).emit('achievement:earned', achievementData);
  }

  // ── Phase 5: Competition events ───────────────────────────────────────────

  @SubscribeMessage('joinCompetitionScoreboard')
  handleJoinCompetitionScoreboard(
    @MessageBody() competitionId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!competitionId || typeof competitionId !== 'string') return;
    void client.join(`competition:${competitionId}:scoreboard`);
    client.emit('joinedCompetitionScoreboard', { competitionId });
  }

  @SubscribeMessage('leaveCompetitionScoreboard')
  handleLeaveCompetitionScoreboard(
    @MessageBody() competitionId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    void client.leave(`competition:${competitionId}:scoreboard`);
  }

  emitCompetitionScoreboard(competitionId: string, scoreboardData: any): void {
    this.server.to(`competition:${competitionId}:scoreboard`).emit('scoreboard:update', scoreboardData);
  }

  emitNationalRecordBroken(competitionId: string, data: any): void {
    this.server.to(`competition:${competitionId}:scoreboard`).emit('nationalRecordBroken', data);
  }

  // ── Phase 4: Coach Module Enhancements ─────────────────────────────────────

  @SubscribeMessage('pauseAndCorrect')
  handlePauseAndCorrect(
    @MessageBody() payload: { targetShooterId: string; message: string },
    @ConnectedSocket() client: Socket,
  ): void {
    // Coach sends pauseAndCorrect, gateway forwards it to the specific shooter's user room
    this.server.to(`user:${payload.targetShooterId}`).emit('coach:pauseAndCorrect', {
      message: payload.message,
      timestamp: Date.now(),
    });
  }
}
