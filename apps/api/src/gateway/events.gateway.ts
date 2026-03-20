// apps/api/src/gateway/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  handleConnection(client: Socket): void {
    console.log(`WS client connected: ${client.id}`);
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
}
