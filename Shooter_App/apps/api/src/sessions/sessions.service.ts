// apps/api/src/sessions/sessions.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Session, UserRole } from '@shooting-platform/shared-types';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForActor(
    actorId: string,
    role: UserRole,
    dto: CreateSessionDto,
    shooterId?: string,
  ): Promise<Session> {
    const targetShooterId = await this.resolveShooterForWrite(actorId, role, shooterId);

    const session = await this.prisma.session.create({
      data: {
        shooterId: targetShooterId,
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

  async findAllForActor(
    actorId: string,
    role: UserRole,
    shooterId?: string,
  ): Promise<Session[]> {
    const targetShooterId = await this.resolveShooterForRead(actorId, role, shooterId);

    const sessions = await this.prisma.session.findMany({
      where: { shooterId: targetShooterId, deletedAt: null },
      orderBy: { sessionDate: 'desc' },
    });
    return sessions.map((s) => this.mapSession(s));
  }

  async findOneWithShotsForActor(
    sessionId: string,
    actorId: string,
    role: UserRole,
    shooterIdHint?: string,
  ): Promise<Session> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: {
        shots: { orderBy: { shotNumber: 'asc' } },
        feedback: {
          include: { coach: { select: { id: true, name: true, email: true, role: true, createdAt: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (shooterIdHint && shooterIdHint !== session.shooterId) {
      throw new ForbiddenException('Session does not belong to the requested shooter');
    }
    await this.assertActorCanReadShooter(actorId, role, session.shooterId);

    return this.mapSession(session);
  }

  async softDeleteForActor(
    sessionId: string,
    actorId: string,
    role: UserRole,
    shooterIdHint?: string,
  ): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (shooterIdHint && shooterIdHint !== session.shooterId) {
      throw new ForbiddenException('Session does not belong to the requested shooter');
    }
    await this.assertActorCanWriteShooter(actorId, role, session.shooterId);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });
  }

  private async resolveShooterForRead(actorId: string, role: UserRole, shooterId?: string): Promise<string> {
    if (role === 'COACH') {
      if (!shooterId) throw new BadRequestException('shooterId is required for coach access');
      await this.assertCoachCanAccessShooter(actorId, shooterId);
      return shooterId;
    }
    return actorId;
  }

  private async resolveShooterForWrite(actorId: string, role: UserRole, shooterId?: string): Promise<string> {
    if (role === 'COACH') {
      if (!shooterId) throw new BadRequestException('shooterId is required for coach access');
      await this.assertCoachCanAccessShooter(actorId, shooterId);
      return shooterId;
    }
    return actorId;
  }

  private async assertActorCanReadShooter(actorId: string, role: UserRole, shooterId: string): Promise<void> {
    if (role === 'COACH') {
      await this.assertCoachCanAccessShooter(actorId, shooterId);
      return;
    }
    if (actorId !== shooterId) throw new ForbiddenException('Access denied');
  }

  private async assertActorCanWriteShooter(actorId: string, role: UserRole, shooterId: string): Promise<void> {
    if (role === 'COACH') {
      await this.assertCoachCanAccessShooter(actorId, shooterId);
      return;
    }
    if (actorId !== shooterId) throw new ForbiddenException('You do not own this session');
  }

  private async assertCoachCanAccessShooter(coachId: string, shooterId: string): Promise<void> {
    const [connection, managedProfile] = await Promise.all([
      this.prisma.coachConnection.findFirst({
        where: { coachId, shooterId, status: 'APPROVED' },
        select: { id: true },
      }),
      this.prisma.shooterProfile.findFirst({
        where: { userId: shooterId, managedByCoachId: coachId, isManaged: true },
        select: { id: true },
      }),
    ]);

    if (!connection && !managedProfile) {
      throw new ForbiddenException('No approved coaching relationship with this shooter');
    }
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
    shots?: unknown[];
    feedback?: unknown[];
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
      shots: session.shots as Session['shots'],
      feedback: session.feedback as Session['feedback'],
    };
  }
}
