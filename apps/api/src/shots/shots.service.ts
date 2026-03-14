// apps/api/src/shots/shots.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { parseFile } from './shots.parser';
import { ManualShotsDto } from './dto/manual-shots.dto';
import { Shot, ShotInput, UserRole } from '@shooting-platform/shared-types';

@Injectable()
export class ShotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ── Shared creation method (all 3 input methods funnel here) ───────────────

  async createShots(
    sessionId: string,
    actorId: string,
    actorRole: UserRole,
    shots: ShotInput[],
    shooterIdHint?: string,
  ): Promise<Shot[]> {
    if (shots.length === 0) {
      throw new BadRequestException('No shots provided');
    }

    // Verify session ownership / access
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
      select: { id: true, shooterId: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found or access denied`);
    }

    if (shooterIdHint && shooterIdHint !== session.shooterId) {
      throw new ForbiddenException('Session does not belong to the requested shooter');
    }

    if (actorRole === 'COACH') {
      await this.assertCoachCanAccessShooter(actorId, session.shooterId);
    } else if (session.shooterId !== actorId) {
      throw new ForbiddenException('You do not own this session');
    }

    const existingForNumbering = await this.prisma.shot.count({ where: { sessionId } });
    const created = await this.prisma.$transaction(
      shots.map((shot, i) =>
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

    // Emit WebSocket event to notify clients watching this session
    this.eventsGateway.emitSessionUpdated(sessionId, totalShots);

    return created.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      shotNumber: s.shotNumber,
      score: s.score,
      x: s.x,
      y: s.y,
      timestamp: s.timestamp,
    }));
  }

  // ── Method 1: File Import ──────────────────────────────────────────────────

  async importFromFile(
    sessionId: string,
    actorId: string,
    actorRole: UserRole,
    file: Express.Multer.File,
    shooterIdHint?: string,
  ): Promise<Shot[]> {
    const shots = await parseFile(file.buffer, file.mimetype, file.originalname);
    return this.createShots(sessionId, actorId, actorRole, shots, shooterIdHint);
  }

  // ── Method 2: Manual Entry ─────────────────────────────────────────────────

  async createManual(
    dto: ManualShotsDto,
    actorId: string,
    actorRole: UserRole,
    shooterIdHint?: string,
  ): Promise<Shot[]> {
    return this.createShots(dto.sessionId, actorId, actorRole, dto.shots, shooterIdHint);
  }

  // ── Method 3: Photo Analysis via Vision Service ────────────────────────────

  async analyzePhoto(
    sessionId: string,
    actorId: string,
    actorRole: UserRole,
    file: Express.Multer.File,
    shooterIdHint?: string,
  ): Promise<Shot[]> {
    const visionUrl = process.env.VISION_SERVICE_URL;
    if (!visionUrl) {
      throw new BadRequestException('Vision service URL is not configured');
    }

    // Forward image to FastAPI vision service
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    let visionResponse: Response;
    try {
      visionResponse = await fetch(`${visionUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      throw new ServiceUnavailableException(
        'Vision service is not running. Start it with: cd apps/vision && uvicorn main:app',
      );
    }

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      throw new BadRequestException(`Vision service error: ${errorText}`);
    }

    const analysisResult = await visionResponse.json() as {
      shots: Array<{
        shotNumber: number;
        score: number;
        x: number;
        y: number;
      }>;
    };

    if (!Array.isArray(analysisResult.shots)) {
      throw new BadRequestException('Vision service returned unexpected format');
    }

    const shots: ShotInput[] = analysisResult.shots.map((s) => ({
      shotNumber: s.shotNumber,
      score: s.score,
      x: s.x,
      y: s.y,
    }));

    return this.createShots(sessionId, actorId, actorRole, shots, shooterIdHint);
  }

  async findBySession(sessionId: string): Promise<Shot[]> {
    const shots = await this.prisma.shot.findMany({
      where: { sessionId },
      orderBy: { shotNumber: 'asc' },
    });
    return shots.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      shotNumber: s.shotNumber,
      score: s.score,
      x: s.x,
      y: s.y,
      timestamp: s.timestamp,
    }));
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
}
