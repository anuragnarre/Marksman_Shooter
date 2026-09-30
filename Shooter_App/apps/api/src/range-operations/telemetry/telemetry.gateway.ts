import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/telemetry',
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemetryGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to telemetry: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from telemetry: ${client.id}`);
  }

  /**
   * 2.2 Live Hardware Telemetry Integration
   * Receives incoming shot data from a target frame sensor and broadcasts it to the Command Center.
   */
  @SubscribeMessage('hardware_target_hit')
  async handleTargetHit(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Example data: { deviceId: '123', score: 10.2, x: 0.5, y: -0.1, timestamp: '...' }
    this.logger.debug(`Received shot from hardware: ${JSON.stringify(data)}`);
    
    // 1. Find which lane this device is connected to
    const lane = await this.prisma.rangeLane.findFirst({
      where: { deviceId: data.deviceId },
      include: { activeSession: true }
    });

    if (lane && lane.activeSession) {
      // 2. Register the shot in the DB
      const shot = await this.prisma.shot.create({
        data: {
          sessionId: lane.activeSession.id,
          shotNumber: (await this.prisma.shot.count({ where: { sessionId: lane.activeSession.id } })) + 1,
          score: data.score,
          x: data.x,
          y: data.y,
        }
      });

      // 3. Broadcast to all command center admins subscribing to this range
      this.server.to(`range_${lane.rangeId}`).emit('command_center_shot_update', {
        laneId: lane.id,
        laneNumber: lane.laneNumber,
        shot
      });

      return { event: 'hit_registered', data: shot };
    }
  }

  /**
   * Listen for Command Center subscribing to a specific range's live feed
   */
  @SubscribeMessage('subscribe_range_telemetry')
  handleSubscribeRange(@MessageBody() data: { rangeId: string }, @ConnectedSocket() client: Socket) {
    client.join(`range_${data.rangeId}`);
    this.logger.log(`Client ${client.id} subscribed to range_${data.rangeId}`);
  }

  /**
   * 2.2 Automated "Cold Range" Safety
   * If a hardware malfunction is detected or emergency button pressed, broadcast CEASE FIRE.
   */
  @SubscribeMessage('trigger_cease_fire')
  async handleCeaseFire(@MessageBody() data: { rangeId: string, laneId?: string, reason: string }, @ConnectedSocket() client: Socket) {
    this.logger.warn(`CEASE FIRE TRIGGERED for Range ${data.rangeId} - Reason: ${data.reason}`);

    if (data.laneId) {
      // Set specific lane to MAINTENANCE
      await this.prisma.rangeLane.update({
        where: { id: data.laneId },
        data: { status: 'MAINTENANCE', notes: `CEASE FIRE: ${data.reason}` }
      });
    } else {
      // Set all active lanes to MAINTENANCE? 
      // For now, let's just log it and broadcast to command center.
    }

    this.server.to(`range_${data.rangeId}`).emit('cease_fire_alert', data);
    
    // Also notify target frames to lock
    this.server.emit('lock_target_frames', { rangeId: data.rangeId });
  }
}
