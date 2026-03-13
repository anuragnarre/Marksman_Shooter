// apps/api/src/coach/coach.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { InviteShooterDto } from './dto/invite-shooter.dto';
import {
  CoachConnection,
  CoachFeedback,
  Session,
  User,
} from '@shooting-platform/shared-types';

// ── Type alias for the Prisma connection row ──────────────────────────────────

type PrismaConnection = {
  id: string;
  shooterId: string;
  coachId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  initiatedBy: string;
  createdAt: Date;
  shooter?: { id: string; name: string; email: string; role: 'SHOOTER' | 'COACH' | 'SOLDIER'; createdAt: Date };
  coach?:   { id: string; name: string; email: string; role: 'SHOOTER' | 'COACH' | 'SOLDIER'; createdAt: Date };
};

const USER_SELECT = {
  id: true, name: true, email: true, role: true, createdAt: true,
} as const;

@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ── Shooter-initiated flow ────────────────────────────────────────────────

  /** Shooter sends a connection request to a coach. */
  async requestConnection(
    shooterId: string,
    dto: CreateConnectionDto,
  ): Promise<CoachConnection> {
    const coach = await this.prisma.user.findFirst({
      where: { id: dto.coachId, role: 'COACH' },
    });
    if (!coach) throw new NotFoundException(`Coach ${dto.coachId} not found`);

    const existing = await this.prisma.coachConnection.findFirst({
      where: { shooterId, coachId: dto.coachId, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (existing) {
      throw new ConflictException('A connection with this coach already exists');
    }

    const connection = await this.prisma.coachConnection.create({
      data: { shooterId, coachId: dto.coachId, status: 'PENDING', initiatedBy: 'SHOOTER' },
    });

    // Notify the coach in real-time
    this.eventsGateway.emitConnectionInvite(dto.coachId, connection.id);

    return this.mapConnection(connection);
  }

  /** Coach approves a shooter-initiated pending request. */
  async approveConnection(
    connectionId: string,
    coachId: string,
  ): Promise<CoachConnection> {
    const connection = await this.prisma.coachConnection.findFirst({
      where: { id: connectionId, coachId, initiatedBy: 'SHOOTER' },
    });
    if (!connection) throw new NotFoundException(`Connection ${connectionId} not found`);
    if (connection.status === 'APPROVED') throw new ConflictException('Already approved');

    const updated = await this.prisma.coachConnection.update({
      where: { id: connectionId },
      data: { status: 'APPROVED' },
    });

    // Notify the shooter their request was accepted
    this.eventsGateway.emitConnectionAccepted(connection.shooterId, connectionId);

    return this.mapConnection(updated);
  }

  /** Coach rejects a shooter-initiated pending request. */
  async rejectConnection(
    connectionId: string,
    coachId: string,
  ): Promise<CoachConnection> {
    const connection = await this.prisma.coachConnection.findFirst({
      where: { id: connectionId, coachId, initiatedBy: 'SHOOTER' },
    });
    if (!connection) throw new NotFoundException(`Connection ${connectionId} not found`);
    if (connection.status !== 'PENDING') {
      throw new ConflictException('Only pending connections can be rejected');
    }

    const updated = await this.prisma.coachConnection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED' },
    });

    this.eventsGateway.emitConnectionDeclined(connection.shooterId, connectionId);

    return this.mapConnection(updated);
  }

  /** Coach views pending requests from shooters. */
  async getPendingRequests(coachId: string): Promise<CoachConnection[]> {
    const connections = await this.prisma.coachConnection.findMany({
      where: { coachId, status: 'PENDING', initiatedBy: 'SHOOTER' },
      include: { shooter: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return connections.map((c) => this.mapConnection(c));
  }

  // ── Coach-initiated flow ──────────────────────────────────────────────────

  /** Coach finds a shooter by email to invite. */
  async findShooterByEmail(email: string): Promise<User | null> {
    const shooter = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), role: 'SHOOTER' },
      select: USER_SELECT,
    });
    if (!shooter) return null;
    return {
      id: shooter.id,
      name: shooter.name,
      email: shooter.email,
      role: shooter.role,
      createdAt: shooter.createdAt,
    };
  }

  /** Coach sends an invitation to a specific shooter. */
  async inviteShooter(
    coachId: string,
    dto: InviteShooterDto,
  ): Promise<CoachConnection> {
    const shooter = await this.prisma.user.findFirst({
      where: { id: dto.shooterId, role: 'SHOOTER' },
    });
    if (!shooter) throw new NotFoundException(`Shooter ${dto.shooterId} not found`);

    const existing = await this.prisma.coachConnection.findFirst({
      where: {
        shooterId: dto.shooterId,
        coachId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existing) {
      throw new ConflictException('A connection with this shooter already exists');
    }

    const connection = await this.prisma.coachConnection.create({
      data: { shooterId: dto.shooterId, coachId, status: 'PENDING', initiatedBy: 'COACH' },
    });

    // Notify the shooter they received an invite
    this.eventsGateway.emitConnectionInvite(dto.shooterId, connection.id);

    return this.mapConnection(connection);
  }

  /** Coach views their outgoing invites (coach-initiated, not yet resolved). */
  async getOutgoingInvites(coachId: string): Promise<CoachConnection[]> {
    const connections = await this.prisma.coachConnection.findMany({
      where: { coachId, initiatedBy: 'COACH', status: { in: ['PENDING', 'REJECTED'] } },
      include: { shooter: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return connections.map((c) => this.mapConnection(c));
  }

  /** Coach cancels a pending outgoing invite. */
  async cancelInvite(connectionId: string, coachId: string): Promise<void> {
    const connection = await this.prisma.coachConnection.findFirst({
      where: { id: connectionId, coachId, initiatedBy: 'COACH', status: 'PENDING' },
    });
    if (!connection) {
      throw new NotFoundException(`Invite ${connectionId} not found or cannot be cancelled`);
    }
    await this.prisma.coachConnection.delete({ where: { id: connectionId } });
  }

  // ── Shooter approval flow (for coach-initiated invites) ───────────────────

  /** Shooter views pending invites sent by coaches. */
  async getIncomingInvites(shooterId: string): Promise<CoachConnection[]> {
    const connections = await this.prisma.coachConnection.findMany({
      where: { shooterId, status: 'PENDING', initiatedBy: 'COACH' },
      include: { coach: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return connections.map((c) => this.mapConnection(c));
  }

  /** Shooter approves a coach-initiated invite. */
  async approveInvite(
    connectionId: string,
    shooterId: string,
  ): Promise<CoachConnection> {
    const connection = await this.prisma.coachConnection.findFirst({
      where: { id: connectionId, shooterId, initiatedBy: 'COACH' },
    });
    if (!connection) throw new NotFoundException(`Invite ${connectionId} not found`);
    if (connection.status !== 'PENDING') {
      throw new ConflictException('Invite is no longer pending');
    }

    const updated = await this.prisma.coachConnection.update({
      where: { id: connectionId },
      data: { status: 'APPROVED' },
    });

    // Notify the coach their invite was accepted
    this.eventsGateway.emitConnectionAccepted(connection.coachId, connectionId);

    return this.mapConnection(updated);
  }

  /** Shooter rejects a coach-initiated invite. */
  async rejectInvite(
    connectionId: string,
    shooterId: string,
  ): Promise<CoachConnection> {
    const connection = await this.prisma.coachConnection.findFirst({
      where: { id: connectionId, shooterId, initiatedBy: 'COACH' },
    });
    if (!connection) throw new NotFoundException(`Invite ${connectionId} not found`);
    if (connection.status !== 'PENDING') {
      throw new ConflictException('Invite is no longer pending');
    }

    const updated = await this.prisma.coachConnection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED' },
    });

    this.eventsGateway.emitConnectionDeclined(connection.coachId, connectionId);

    return this.mapConnection(updated);
  }

  // ── Shared read methods ───────────────────────────────────────────────────

  /** Shooter lists all coaches available to connect with. */
  async getAvailableCoaches(): Promise<User[]> {
    const coaches = await this.prisma.user.findMany({
      where: { role: 'COACH' },
      select: USER_SELECT,
      orderBy: { name: 'asc' },
    });
    return coaches.map((c) => ({
      id: c.id, name: c.name, email: c.email, role: c.role, createdAt: c.createdAt,
    }));
  }

  /** Shooter views all their connections (both directions, all statuses). */
  async getMyConnections(shooterId: string): Promise<CoachConnection[]> {
    const connections = await this.prisma.coachConnection.findMany({
      where: { shooterId },
      include: { coach: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return connections.map((c) => this.mapConnection(c));
  }

  /** Coach lists their approved shooters. */
  async getMyShooters(coachId: string): Promise<User[]> {
    const connections = await this.prisma.coachConnection.findMany({
      where: { coachId, status: 'APPROVED' },
      include: { shooter: { select: USER_SELECT } },
    });
    return connections.map((c) => ({
      id: c.shooter.id,
      name: c.shooter.name,
      email: c.shooter.email,
      role: c.shooter.role,
      createdAt: c.shooter.createdAt,
    }));
  }

  /** Coach views a specific shooter's sessions (requires approved connection). */
  async getShooterSessions(
    shooterId: string,
    coachId: string,
  ): Promise<Session[]> {
    const connection = await this.prisma.coachConnection.findFirst({
      where: { shooterId, coachId, status: 'APPROVED' },
    });
    if (!connection) {
      throw new ForbiddenException('No approved coaching relationship with this shooter');
    }

    const sessions = await this.prisma.session.findMany({
      where: { shooterId, deletedAt: null },
      include: { shots: { orderBy: { shotNumber: 'asc' } } },
      orderBy: { sessionDate: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      shooterId: s.shooterId,
      discipline: s.discipline,
      distance: s.distance,
      weaponType: s.weaponType,
      numberOfShots: s.numberOfShots,
      sessionDate: s.sessionDate,
      trainingMode: s.trainingMode,
      createdAt: s.createdAt,
      deletedAt: s.deletedAt ?? undefined,
      shots: s.shots.map((shot) => ({
        id: shot.id,
        sessionId: shot.sessionId,
        shotNumber: shot.shotNumber,
        score: shot.score,
        x: shot.x,
        y: shot.y,
        timestamp: shot.timestamp,
      })),
    }));
  }

  /** Coach posts feedback on a session. */
  async addFeedback(
    coachId: string,
    dto: CreateFeedbackDto,
  ): Promise<CoachFeedback> {
    const session = await this.prisma.session.findFirst({
      where: { id: dto.sessionId, deletedAt: null },
    });
    if (!session) throw new NotFoundException(`Session ${dto.sessionId} not found`);

    const connection = await this.prisma.coachConnection.findFirst({
      where: { shooterId: session.shooterId, coachId, status: 'APPROVED' },
    });
    if (!connection) {
      throw new ForbiddenException('No approved coaching relationship with this session\'s shooter');
    }

    const feedback = await this.prisma.coachFeedback.create({
      data: { coachId, sessionId: dto.sessionId, feedback: dto.feedback },
      include: { coach: { select: USER_SELECT } },
    });

    const mappedFeedback: CoachFeedback = {
      id: feedback.id,
      coachId: feedback.coachId,
      sessionId: feedback.sessionId,
      feedback: feedback.feedback,
      createdAt: feedback.createdAt,
      coach: {
        id: feedback.coach.id,
        name: feedback.coach.name,
        email: feedback.coach.email,
        role: feedback.coach.role,
        createdAt: feedback.coach.createdAt,
      },
    };

    this.eventsGateway.emitFeedbackAdded(dto.sessionId, mappedFeedback);

    return mappedFeedback;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private mapConnection(c: PrismaConnection): CoachConnection {
    return {
      id: c.id,
      shooterId: c.shooterId,
      coachId: c.coachId,
      status: c.status,
      initiatedBy: c.initiatedBy as 'SHOOTER' | 'COACH',
      createdAt: c.createdAt,
      ...(c.shooter && {
        shooter: {
          id: c.shooter.id, name: c.shooter.name, email: c.shooter.email,
          role: c.shooter.role, createdAt: c.shooter.createdAt,
        },
      }),
      ...(c.coach && {
        coach: {
          id: c.coach.id, name: c.coach.name, email: c.coach.email,
          role: c.coach.role, createdAt: c.coach.createdAt,
        },
      }),
    };
  }
}
