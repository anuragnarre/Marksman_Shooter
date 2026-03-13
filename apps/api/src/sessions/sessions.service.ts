// apps/api/src/sessions/sessions.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Session } from '@shooting-platform/shared-types';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(shooterId: string, dto: CreateSessionDto): Promise<Session> {
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

  async findAllForShooter(shooterId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: { shooterId, deletedAt: null },
      orderBy: { sessionDate: 'desc' },
    });
    return sessions.map((s) => this.mapSession(s));
  }

  async findOneWithShots(sessionId: string, shooterId: string): Promise<Session> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, shooterId, deletedAt: null },
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

    return this.mapSession(session);
  }

  async softDelete(sessionId: string, shooterId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.shooterId !== shooterId) {
      throw new ForbiddenException('You do not own this session');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });
  }

  // Coach access — verify connection then return session with shots
  async findOneForCoach(sessionId: string, coachId: string): Promise<Session> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: {
        shots: { orderBy: { shotNumber: 'asc' } },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Verify coach has an approved connection to this shooter
    const connection = await this.prisma.coachConnection.findFirst({
      where: {
        shooterId: session.shooterId,
        coachId,
        status: 'APPROVED',
      },
    });

    if (!connection) {
      throw new ForbiddenException('No approved coaching relationship with this shooter');
    }

    return this.mapSession(session);
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
