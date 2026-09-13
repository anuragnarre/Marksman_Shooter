// apps/api/src/coach/coach.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { InviteShooterDto } from './dto/invite-shooter.dto';
import { CreateManagedShooterDto } from './dto/create-managed-shooter.dto';
import { UpdateManagedShooterDto } from './dto/update-managed-shooter.dto';
import { CreateManagedShotsDto } from './dto/create-managed-shots.dto';
import { CreateSessionDto } from '../sessions/dto/create-session.dto';
import {
  CoachDashboardData,
  CoachDashboardRecentSession,
  CoachDashboardScheduleItem,
  CoachDashboardShooterSummary,
  CoachConnection,
  CoachFeedback,
  CoachShooterPerformanceSummary,
  Session,
  Shot,
  User,
  UserRole,
} from '@shooting-platform/shared-types';

// ── Type alias for the Prisma connection row ──────────────────────────────────

type PrismaConnection = {
  id: string;
  shooterId: string;
  coachId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  initiatedBy: string;
  createdAt: Date;
  shooter?: { id: string; name: string; email: string; role: UserRole; createdAt: Date };
  coach?:   { id: string; name: string; email: string; role: UserRole; createdAt: Date };
};

const USER_SELECT = {
  id: true, name: true, email: true, role: true, createdAt: true,
} as const;

const SHOOTER_PROFILE_SELECT = {
  id: true,
  userId: true,
  shooterCode: true,
  primaryWeapon: true,
  managedByCoachId: true,
  isManaged: true,
  createdAt: true,
  updatedAt: true,
} as const;

const USER_SELECT_WITH_PROFILE = {
  ...USER_SELECT,
  shooterProfile: { select: SHOOTER_PROFILE_SELECT },
} as const;

const BCRYPT_SALT_ROUNDS = 12;

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
      include: { shooter: { select: USER_SELECT_WITH_PROFILE } },
    });
    const deduped = new Map<string, User>();
    for (const connection of connections) {
      deduped.set(connection.shooter.id, this.mapUser(connection.shooter));
    }
    return Array.from(deduped.values());
  }

  /** Coach dashboard data: roster intelligence, recent sessions, and schedule overview. */
  async getCoachDashboard(coachId: string): Promise<CoachDashboardData> {
    const [connectedShooters, managedShooters, pendingRequests] = await Promise.all([
      this.getMyShooters(coachId),
      this.getManagedShooterProfiles(coachId),
      this.prisma.coachConnection.count({
        where: { coachId, status: 'PENDING', initiatedBy: 'SHOOTER' },
      }),
    ]);

    const shooterById = new Map<string, User>();
    for (const shooter of connectedShooters) shooterById.set(shooter.id, shooter);
    for (const shooter of managedShooters) {
      shooterById.set(shooter.id, {
        ...shooterById.get(shooter.id),
        ...shooter,
        shooterProfile: shooter.shooterProfile ?? shooterById.get(shooter.id)?.shooterProfile,
      });
    }

    const shooters = Array.from(shooterById.values());
    const shooterIds = shooters.map((shooter) => shooter.id);
    const now = new Date();
    const since30Days = new Date(now.getTime() - 30 * 86400000);
    const next7Days = new Date(now.getTime() + 7 * 86400000);

    const [sessions, events] = await Promise.all([
      shooterIds.length
        ? this.prisma.session.findMany({
            where: { shooterId: { in: shooterIds }, deletedAt: null },
            include: {
              shots: true,
              shooter: { select: { id: true, name: true } },
            },
            orderBy: { sessionDate: 'desc' },
            take: 200,
          })
        : Promise.resolve([]),
      this.prisma.trainingEvent.findMany({
        where: {
          coachId,
          deletedAt: null,
          start: { gte: new Date(now.getTime() - 86400000) },
        },
        include: {
          assignees: {
            include: {
              shooter: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { start: 'asc' },
        take: 40,
      }),
    ]);

    const recentSessions: CoachDashboardRecentSession[] = [];
    const shooterStats = new Map<string, {
      totalSessions: number;
      totalShots: number;
      totalScore: number;
      bestScore: number;
      allScores: number[];
      recentSessionAverages: number[];
      lastSessionDate: string | null;
      active30d: boolean;
    }>();

    let totalShots = 0;
    let totalScore = 0;
    let xRingCount = 0;

    for (const session of sessions) {
      const scores = session.shots.map((shot) => shot.score);
      const sessionShotCount = scores.length;
      const sessionScoreSum = scores.reduce((sum, score) => sum + score, 0);
      const sessionAvg = sessionShotCount ? sessionScoreSum / sessionShotCount : 0;
      const groupRadius = this.computeGroupRadius(session.shots);

      totalShots += sessionShotCount;
      totalScore += sessionScoreSum;
      xRingCount += scores.filter((score) => score >= 10.5).length;

      recentSessions.push({
        sessionId: session.id,
        shooterId: session.shooterId,
        shooterName: session.shooter.name,
        sessionDate: session.sessionDate.toISOString(),
        discipline: session.discipline,
        weaponType: session.weaponType,
        trainingMode: session.trainingMode,
        totalShots: sessionShotCount,
        averageScore: this.round(sessionAvg, 2),
        groupRadius: this.round(groupRadius, 2),
      });

      const stat = shooterStats.get(session.shooterId) ?? {
        totalSessions: 0,
        totalShots: 0,
        totalScore: 0,
        bestScore: 0,
        allScores: [],
        recentSessionAverages: [],
        lastSessionDate: null,
        active30d: false,
      };

      stat.totalSessions += 1;
      stat.totalShots += sessionShotCount;
      stat.totalScore += sessionScoreSum;
      stat.bestScore = Math.max(stat.bestScore, ...scores, 0);
      stat.allScores.push(...scores);
      if (sessionShotCount > 0 && stat.recentSessionAverages.length < 5) {
        stat.recentSessionAverages.push(sessionAvg);
      }
      if (!stat.lastSessionDate) {
        stat.lastSessionDate = session.sessionDate.toISOString();
      }
      if (session.sessionDate >= since30Days) {
        stat.active30d = true;
      }

      shooterStats.set(session.shooterId, stat);
    }

    const shooterSummaries: CoachDashboardShooterSummary[] = shooters
      .map((shooter) => {
        const stat = shooterStats.get(shooter.id);
        const avg = stat && stat.totalShots > 0 ? stat.totalScore / stat.totalShots : 0;
        const variance = stat && stat.allScores.length > 1
          ? stat.allScores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / stat.allScores.length
          : 0;
        const stdDev = Math.sqrt(variance);
        const consistency = stat && stat.totalShots > 0 ? Math.max(0, 10 - stdDev * 5) : 0;
        const recentForm = stat && stat.recentSessionAverages.length > 0
          ? stat.recentSessionAverages.slice(0, 3).reduce((sum, value) => sum + value, 0) / Math.min(3, stat.recentSessionAverages.length)
          : 0;

        return {
          shooterId: shooter.id,
          shooterName: shooter.name,
          shooterCode: shooter.shooterProfile?.shooterCode ?? null,
          primaryWeapon: shooter.shooterProfile?.primaryWeapon ?? null,
          isManaged: shooter.shooterProfile?.isManaged ?? false,
          totalSessions: stat?.totalSessions ?? 0,
          totalShots: stat?.totalShots ?? 0,
          averageScore: this.round(avg, 2),
          bestScore: this.round(stat?.bestScore ?? 0, 1),
          consistency: this.round(consistency, 1),
          recentForm: this.round(recentForm, 2),
          lastSessionDate: stat?.lastSessionDate ?? null,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);

    const schedule: CoachDashboardScheduleItem[] = events.slice(0, 12).map((event) => ({
      eventId: event.id,
      title: event.title,
      eventType: event.eventType,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      allDay: event.allDay,
      assigneeCount: event.assignees.length,
      shooterNames: Array.from(new Set(event.assignees.map((assignee) => assignee.shooter.name))),
    }));

    const activeShooters30d = shooterSummaries.filter(
      (summary) => shooterStats.get(summary.shooterId)?.active30d,
    ).length;
    const upcomingItems7d = events.filter((event) => event.start >= now && event.start <= next7Days).length;
    const plannedTasks = events.filter(
      (event) => event.start >= now && (event.eventType === 'TASK' || event.eventType === 'PLAN'),
    ).length;

    return {
      generatedAt: now.toISOString(),
      analytics: {
        totalShooters: shooters.length,
        activeShooters30d,
        totalSessions: sessions.length,
        totalShots,
        averageScore: this.round(totalShots ? totalScore / totalShots : 0, 2),
        xRingRate: this.round(totalShots ? (xRingCount / totalShots) * 100 : 0, 1),
        pendingRequests,
        upcomingItems7d,
        plannedTasks,
      },
      shooterSummaries,
      recentSessions: recentSessions.slice(0, 12),
      schedule,
    };
  }

  /** Coach lists only managed shooter profiles they created. */
  async getManagedShooterProfiles(coachId: string): Promise<User[]> {
    const profiles = await this.prisma.shooterProfile.findMany({
      where: { managedByCoachId: coachId, isManaged: true },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    return profiles.map((profile) => ({
      ...this.mapUser(profile.user),
      shooterProfile: this.mapShooterProfile(profile),
    }));
  }

  /** Coach creates a managed shooter profile (for students without their own account/device). */
  async createManagedShooterProfile(
    coachId: string,
    dto: CreateManagedShooterDto,
  ): Promise<User> {
    const shooterCode = dto.shooterCode.trim().toUpperCase();
    const existingCode = await this.prisma.shooterProfile.findUnique({
      where: { shooterCode },
      select: { id: true },
    });
    if (existingCode) {
      throw new ConflictException(`Shooter ID "${shooterCode}" is already in use`);
    }

    const pseudoEmail = await this.buildUniqueManagedEmail(dto.name);
    const passwordHash = await bcrypt.hash(randomUUID(), BCRYPT_SALT_ROUNDS);

    const created = await this.prisma.$transaction(async (tx) => {
      const shooterUser = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: pseudoEmail,
          passwordHash,
          role: 'SHOOTER',
        },
        select: USER_SELECT,
      });

      const profile = await tx.shooterProfile.create({
        data: {
          userId: shooterUser.id,
          shooterCode,
          primaryWeapon: dto.primaryWeapon?.trim() || null,
          managedByCoachId: coachId,
          isManaged: true,
        },
        select: SHOOTER_PROFILE_SELECT,
      });

      await tx.coachConnection.create({
        data: {
          shooterId: shooterUser.id,
          coachId,
          status: 'APPROVED',
          initiatedBy: 'COACH',
        },
      });

      return { user: shooterUser, shooterProfile: profile };
    });

    return {
      ...this.mapUser(created.user),
      shooterProfile: created.shooterProfile,
    };
  }

  /** Coach edits only their own managed shooter profile details. */
  async updateManagedShooterProfile(
    coachId: string,
    shooterId: string,
    dto: UpdateManagedShooterDto,
  ): Promise<User> {
    const existing = await this.prisma.shooterProfile.findFirst({
      where: { userId: shooterId, managedByCoachId: coachId, isManaged: true },
      include: { user: { select: USER_SELECT } },
    });
    if (!existing) {
      throw new NotFoundException('Managed shooter profile not found');
    }

    const nextCode = dto.shooterCode?.trim().toUpperCase();
    if (nextCode && nextCode !== existing.shooterCode) {
      const conflict = await this.prisma.shooterProfile.findUnique({
        where: { shooterCode: nextCode },
        select: { userId: true },
      });
      if (conflict && conflict.userId !== shooterId) {
        throw new ConflictException(`Shooter ID "${nextCode}" is already in use`);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = dto.name
        ? await tx.user.update({
            where: { id: shooterId },
            data: { name: dto.name.trim() },
            select: USER_SELECT,
          })
        : existing.user;

      const profile = await tx.shooterProfile.update({
        where: { userId: shooterId },
        data: {
          ...(nextCode ? { shooterCode: nextCode } : {}),
          ...(dto.primaryWeapon !== undefined ? { primaryWeapon: dto.primaryWeapon.trim() || null } : {}),
        },
        select: SHOOTER_PROFILE_SELECT,
      });

      return { user, shooterProfile: profile };
    });

    return {
      ...this.mapUser(updated.user),
      shooterProfile: updated.shooterProfile,
    };
  }

  /** Coach can create sessions for their own managed shooter profiles. */
  async createManagedShooterSession(
    coachId: string,
    shooterId: string,
    dto: CreateSessionDto,
  ): Promise<Session> {
    await this.assertCoachCanViewShooter(coachId, shooterId);

    const session = await this.prisma.session.create({
      data: {
        shooterId,
        discipline: dto.discipline,
        distance: dto.distance,
        weaponType: dto.weaponType,
        numberOfShots: dto.numberOfShots,
        sessionDate: new Date(dto.sessionDate),
        trainingMode: dto.trainingMode ?? null,
      },
    });

    return this.mapSession(session);
  }

  /** Coach can add shot data to a managed shooter's session. */
  async addManagedShooterSessionShots(
    coachId: string,
    shooterId: string,
    sessionId: string,
    dto: CreateManagedShotsDto,
  ): Promise<Shot[]> {
    await this.assertCoachCanViewShooter(coachId, shooterId);

    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, shooterId, deletedAt: null },
      select: { id: true },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    const existingForNumbering = await this.prisma.shot.count({ where: { sessionId } });
    const created = await this.prisma.$transaction(
      dto.shots.map((shot, i) =>
        this.prisma.shot.create({
          data: {
            sessionId,
            shotNumber: shot.shotNumber ?? (existingForNumbering + i + 1),
            score: shot.score,
            x: shot.x ?? 0,
            y: shot.y ?? 0,
          },
        }),
      ),
    );

    const totalShots = await this.prisma.shot.count({ where: { sessionId } });
    this.eventsGateway.emitSessionUpdated(sessionId, totalShots);

    return created.map((shot) => ({
      id: shot.id,
      sessionId: shot.sessionId,
      shotNumber: shot.shotNumber,
      score: shot.score,
      x: shot.x,
      y: shot.y,
      timestamp: shot.timestamp,
    }));
  }

  /** Coach can soft-delete sessions they created for managed shooters. */
  async removeManagedShooterSession(
    coachId: string,
    shooterId: string,
    sessionId: string,
  ): Promise<void> {
    await this.assertCoachCanViewShooter(coachId, shooterId);

    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, shooterId, deletedAt: null },
      select: { id: true },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });
  }

  /** Coach views performance summary for shooters they are connected to. */
  async getShooterPerformanceSummary(
    coachId: string,
    shooterId: string,
  ): Promise<CoachShooterPerformanceSummary> {
    await this.assertCoachCanViewShooter(coachId, shooterId);

    const sessions = await this.prisma.session.findMany({
      where: { shooterId, deletedAt: null },
      include: { shots: true },
      orderBy: { sessionDate: 'desc' },
    });

    const shots = sessions.flatMap((session) => session.shots);
    const totalShots = shots.length;
    const averageScore = totalShots
      ? shots.reduce((sum, shot) => sum + shot.score, 0) / totalShots
      : 0;

    return {
      shooterId,
      totalSessions: sessions.length,
      totalShots,
      averageScore: Number(averageScore.toFixed(3)),
      bestScore: totalShots ? Math.max(...shots.map((shot) => shot.score)) : 0,
      lastSessionDate: sessions[0]?.sessionDate.toISOString() ?? null,
    };
  }

  /** Coach views a specific shooter's sessions (requires approved connection). */
  async getShooterSessions(
    shooterId: string,
    coachId: string,
  ): Promise<Session[]> {
    await this.assertCoachCanViewShooter(coachId, shooterId);

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

  private mapUser(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    shooterProfile?: {
      id: string;
      userId: string;
      shooterCode: string;
      primaryWeapon: string | null;
      managedByCoachId: string | null;
      isManaged: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      ...(user.shooterProfile
        ? {
            shooterProfile: {
              id: user.shooterProfile.id,
              userId: user.shooterProfile.userId,
              shooterCode: user.shooterProfile.shooterCode,
              primaryWeapon: user.shooterProfile.primaryWeapon,
              managedByCoachId: user.shooterProfile.managedByCoachId,
              isManaged: user.shooterProfile.isManaged,
              createdAt: user.shooterProfile.createdAt,
              updatedAt: user.shooterProfile.updatedAt,
            },
          }
        : {}),
    };
  }

  private mapShooterProfile(profile: {
    id: string;
    userId: string;
    shooterCode: string;
    primaryWeapon: string | null;
    managedByCoachId: string | null;
    isManaged: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User['shooterProfile'] {
    return {
      id: profile.id,
      userId: profile.userId,
      shooterCode: profile.shooterCode,
      primaryWeapon: profile.primaryWeapon,
      managedByCoachId: profile.managedByCoachId,
      isManaged: profile.isManaged,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private mapSession(session: {
    id: string;
    shooterId: string;
    discipline: string;
    distance: number;
    weaponType: string;
    numberOfShots: number;
    sessionDate: Date;
    trainingMode?: string | null;
    createdAt: Date;
    deletedAt: Date | null;
  }): Session {
    return {
      id: session.id,
      shooterId: session.shooterId,
      discipline: session.discipline,
      distance: session.distance,
      weaponType: session.weaponType,
      numberOfShots: session.numberOfShots,
      sessionDate: session.sessionDate,
      trainingMode: session.trainingMode,
      createdAt: session.createdAt,
      deletedAt: session.deletedAt ?? undefined,
    };
  }

  private async assertCoachOwnsManagedShooter(coachId: string, shooterId: string): Promise<void> {
    const managedProfile = await this.prisma.shooterProfile.findFirst({
      where: { userId: shooterId, managedByCoachId: coachId, isManaged: true },
      select: { id: true },
    });
    if (!managedProfile) {
      throw new ForbiddenException('You can only manage profiles created under your coach account');
    }
  }

  private async assertCoachCanViewShooter(coachId: string, shooterId: string): Promise<void> {
    const [managedProfile, connection] = await Promise.all([
      this.prisma.shooterProfile.findFirst({
        where: { userId: shooterId, managedByCoachId: coachId, isManaged: true },
        select: { id: true },
      }),
      this.prisma.coachConnection.findFirst({
        where: { shooterId, coachId, status: 'APPROVED' },
        select: { id: true },
      }),
    ]);

    if (!managedProfile && !connection) {
      throw new ForbiddenException('No approved coaching relationship with this shooter');
    }
  }

  private async buildUniqueManagedEmail(name: string): Promise<string> {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/(^\.|\.$)/g, '')
      .slice(0, 24) || 'shooter';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `managed.${slug}.${Date.now()}.${Math.floor(Math.random() * 10000)}@marksman.local`;
      const exists = await this.prisma.user.findUnique({
        where: { email: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }

    return `managed.${randomUUID()}@marksman.local`;
  }

  private computeGroupRadius(shots: Array<{ x: number; y: number }>): number {
    if (shots.length < 2) return 0;
    let groupRadius = 0;
    for (let i = 0; i < shots.length; i += 1) {
      for (let j = i + 1; j < shots.length; j += 1) {
        const dx = shots[i].x - shots[j].x;
        const dy = shots[i].y - shots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > groupRadius) groupRadius = dist;
      }
    }
    return groupRadius;
  }

  private round(value: number, decimals = 2): number {
    const base = Math.pow(10, decimals);
    return Math.round(value * base) / base;
  }
}
