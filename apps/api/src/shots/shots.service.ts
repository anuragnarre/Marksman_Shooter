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
import { Shot, ShotInput, UserRole, VisionShotResult } from '@shooting-platform/shared-types';
import { UpdateShotDto } from './dto/update-shot.dto';

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

  // ── Method 3b: Photo Analysis — returns full vision data + persisted shots ──

  async analyzePhotoFull(
    sessionId: string,
    actorId: string,
    actorRole: UserRole,
    file: Express.Multer.File,
    targetType = 'air_rifle_10m',
    shooterIdHint?: string,
    persist = true,
  ): Promise<{
    shots: VisionShotResult[];
    targetDetected: boolean;
    processingTimeMs: number;
    savedShots: Shot[];
  }> {
    const visionUrl = process.env.VISION_SERVICE_URL;
    if (!visionUrl) {
      throw new BadRequestException('Vision service URL is not configured');
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('target_type', targetType);

    let visionResponse: Response;
    try {
      visionResponse = await fetch(`${visionUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Vision service is not running. Start it with: cd apps/vision && uvicorn main:app',
      );
    }

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      throw new BadRequestException(`Vision service error: ${errorText}`);
    }

    const raw = await visionResponse.json() as {
      shots: Array<{
        shot_number: number;
        score: number;
        x: number;
        y: number;
        pixel_x: number;
        pixel_y: number;
        confidence: number;
        is_inner_ten?: boolean;
        dist_mm?: number;
      }>;
      target_detected: boolean;
      processing_time_ms: number;
    };

    if (!Array.isArray(raw.shots)) {
      throw new BadRequestException('Vision service returned unexpected format');
    }

    const visionShots: VisionShotResult[] = raw.shots.map((s) => ({
      shotNumber: s.shot_number,
      score:      s.score,
      x:          s.x,
      y:          s.y,
      pixelX:     s.pixel_x,
      pixelY:     s.pixel_y,
      confidence: s.confidence,
      isInnerTen: s.is_inner_ten ?? false,
      distMm:     s.dist_mm ?? 0,
    }));

    const inputs: ShotInput[] = visionShots.map((s) => ({
      shotNumber: s.shotNumber,
      score:      s.score,
      x:          s.x,
      y:          s.y,
    }));

    const savedShots = persist
      ? await this.createShots(sessionId, actorId, actorRole, inputs, shooterIdHint)
      : [];

    return {
      shots:            visionShots,
      targetDetected:   raw.target_detected,
      processingTimeMs: raw.processing_time_ms,
      savedShots,
    };
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

  async deleteShot(
    shotId: string,
    actorId: string,
    actorRole: UserRole,
  ): Promise<{ deleted: boolean }> {
    const shot = await this.prisma.shot.findFirst({
      where: { id: shotId },
      select: { id: true, sessionId: true, session: { select: { shooterId: true } } },
    });

    if (!shot) {
      throw new NotFoundException(`Shot ${shotId} not found`);
    }

    if (actorRole === 'COACH') {
      await this.assertCoachCanAccessShooter(actorId, shot.session.shooterId);
    } else if (shot.session.shooterId !== actorId) {
      throw new ForbiddenException('You do not own this shot');
    }

    await this.prisma.shot.delete({ where: { id: shotId } });
    const remainingCount = await this.prisma.shot.count({ where: { sessionId: shot.sessionId } });
    this.eventsGateway.emitSessionUpdated(shot.sessionId, remainingCount);
    return { deleted: true };
  }

  // RING_WIDTH_MM mirrors the client-side values in vision-service.ts
  private static readonly RING_WIDTH_MM: Record<string, number> = {
    air_pistol_10m: 8.0,
    air_rifle_10m:  8.0,
    nr_50m:         25.0,
    nr_25m:         25.0,
  };

  async updateShot(
    shotId: string,
    actorId: string,
    actorRole: UserRole,
    dto: UpdateShotDto,
  ): Promise<Shot> {
    const shot = await this.prisma.shot.findFirst({
      where: { id: shotId },
      select: {
        id: true,
        sessionId: true,
        x: true,
        y: true,
        shotNumber: true,
        score: true,
        timestamp: true,
        session: { select: { shooterId: true, discipline: true } },
      },
    });

    if (!shot) {
      throw new NotFoundException(`Shot ${shotId} not found`);
    }

    if (actorRole === 'COACH') {
      await this.assertCoachCanAccessShooter(actorId, shot.session.shooterId);
    } else if (shot.session.shooterId !== actorId) {
      throw new ForbiddenException('You do not own this shot');
    }

    const newX = dto.x ?? shot.x;
    const newY = dto.y ?? shot.y;
    const ringWidth = ShotsService.RING_WIDTH_MM[shot.session.discipline] ?? 8.0;
    const distMm = Math.sqrt(newX ** 2 + newY ** 2);
    const rawScore = 10.9 - distMm / ringWidth;
    const newScore = Math.round(Math.max(0, Math.min(10.9, rawScore)) * 10) / 10;

    const updated = await this.prisma.shot.update({
      where: { id: shotId },
      data: { x: newX, y: newY, score: newScore },
    });

    const shotCount = await this.prisma.shot.count({ where: { sessionId: shot.sessionId } });
    this.eventsGateway.emitSessionUpdated(shot.sessionId, shotCount);

    return {
      id: updated.id,
      sessionId: updated.sessionId,
      shotNumber: updated.shotNumber,
      score: updated.score,
      x: updated.x,
      y: updated.y,
      timestamp: updated.timestamp,
    };
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
