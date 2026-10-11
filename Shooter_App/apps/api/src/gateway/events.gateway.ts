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
    origin: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
    ],
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
    if (!userId || typeof userId !== 'string') return;
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
    this.server.to(`live_range:${rangeId}`).emit('lane_status_updated', { laneId, ...payload });
  }

  // ── High-Speed Wireless Video & Hardware Stream Management ───────────────

  @SubscribeMessage('start_camera_stream')
  handleStartCameraStream(
    @MessageBody() payload: { laneId: string; initialConfig?: any },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.laneId) return;
    const room = `lane_stream:${payload.laneId}`;
    void client.join(room);
    client.emit('stream_started', { laneId: payload.laneId, timestamp: Date.now() });
    this.server.to(room).emit('camera_status', { laneId: payload.laneId, isStreaming: true });
  }

  @SubscribeMessage('stop_camera_stream')
  handleStopCameraStream(
    @MessageBody() payload: { laneId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.laneId) return;
    const room = `lane_stream:${payload.laneId}`;
    this.server.to(room).emit('camera_status', { laneId: payload.laneId, isStreaming: false });
  }

  @SubscribeMessage('subscribe_lane_feed')
  handleSubscribeLaneFeed(
    @MessageBody() payload: { laneId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.laneId) return;
    void client.join(`lane_stream:${payload.laneId}`);
    client.emit('lane_feed_subscribed', { laneId: payload.laneId });
  }

  @SubscribeMessage('camera_frame')
  handleCameraFrame(
    @MessageBody() payload: {
      laneId: string;
      frame: string;
      targetType?: string;
      seq?: number;
      timestamp?: number;
    },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.laneId || !payload?.frame) return;
    const enrichedFrame = {
      ...payload,
      relayedAt: Date.now(),
    };
    // Relay frame to viewers of this lane stream room
    this.server.to(`lane_stream:${payload.laneId}`).emit('camera_frame', enrichedFrame);
  }

  @SubscribeMessage('update_stream_config')
  handleUpdateStreamConfig(
    @MessageBody() payload: { laneId: string; config: any },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.laneId || !payload?.config) return;
    // Broadcast config update to hardware camera publisher and viewers
    this.server.to(`lane_stream:${payload.laneId}`).emit('stream_config_updated', {
      laneId: payload.laneId,
      config: payload.config,
      updatedBy: client.id,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('stream_ping')
  handleStreamPing(
    @MessageBody() payload: { clientTimestamp: number; laneId?: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.emit('stream_pong', {
      clientTimestamp: payload?.clientTimestamp || Date.now(),
      serverTimestamp: Date.now(),
    });
  }

  @SubscribeMessage('shot_impact_snapshot')
  handleShotImpactSnapshot(
    @MessageBody() payload: {
      rangeId?: string;
      laneId: string;
      shotNumber: number;
      score: number;
      xMm: number;
      yMm: number;
      image: string;
      timestamp?: number;
    },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.laneId || !payload?.image) return;
    const enriched = {
      ...payload,
      relayedAt: Date.now(),
    };
    this.server.to(`lane_stream:${payload.laneId}`).emit('shot_impact_snapshot', enriched);
    const rangeId = payload.rangeId || 'main-range-1';
    this.server.to(`range_monitor:${rangeId}`).emit('shot_impact_snapshot', enriched);
  }

  @SubscribeMessage('stream_telemetry')
  handleStreamTelemetry(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.laneId) return;
    this.server.to(`lane_stream:${payload.laneId}`).emit('stream_telemetry', payload);
  }


  // ── Range Emergency Ceasefire (Cross-App Safety) ─────────────────────────

  @SubscribeMessage('broadcastCeasefire')
  handleBroadcastCeasefire(
    @MessageBody() payload: { rangeId: string; reason?: string; initiatedBy?: string; active?: boolean },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.rangeId) return;
    const ceasefireEvent = {
      rangeId: payload.rangeId,
      active: payload.active !== false,
      reason: payload.reason || 'Emergency Ceasefire ordered by Range Safety Officer',
      initiatedBy: payload.initiatedBy || 'Range Safety Officer',
      timestamp: Date.now(),
    };
    this.server.to(`range_monitor:${payload.rangeId}`).emit('range_ceasefire', ceasefireEvent);
    this.server.to(`live_range:${payload.rangeId}`).emit('range_ceasefire', ceasefireEvent);
    this.server.emit('range_ceasefire', ceasefireEvent);
  }

  @SubscribeMessage('clearCeasefire')
  handleClearCeasefire(
    @MessageBody() payload: { rangeId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    if (!payload?.rangeId) return;
    const event = {
      rangeId: payload.rangeId,
      active: false,
      timestamp: Date.now(),
    };
    this.server.to(`range_monitor:${payload.rangeId}`).emit('range_ceasefire', event);
    this.server.to(`live_range:${payload.rangeId}`).emit('range_ceasefire', event);
    this.server.emit('range_ceasefire', event);
  }

  emitRangeCeasefire(rangeId: string, active: boolean, reason?: string, initiatedBy?: string): void {
    const event = {
      rangeId,
      active,
      reason: reason || 'Emergency Ceasefire ordered by Range Safety Officer',
      initiatedBy: initiatedBy || 'Range Safety Officer',
      timestamp: Date.now(),
    };
    this.server.to(`range_monitor:${rangeId}`).emit('range_ceasefire', event);
    this.server.to(`live_range:${rangeId}`).emit('range_ceasefire', event);
    this.server.emit('range_ceasefire', event);
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
