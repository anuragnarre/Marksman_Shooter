// apps/api/src/shots/shots.service.ts
import {
  Logger,
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
import { VisionService } from './vision.service';

@Injectable()
export class ShotsService {
  private readonly logger = new Logger(ShotsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly visionService: VisionService,
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
    const analysisResult = await this.visionService.analyzeImage(file.buffer, file.mimetype, 'air_rifle_10m');

    if (!analysisResult.targetDetected || analysisResult.shots.length === 0) {
      throw new BadRequestException('No bullet holes detected in this photo. Ensure the target is clearly visible and well-lit.');
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
    warpCenterX: number;
    warpCenterY: number;
    warpWidth: number;
    warpHeight: number;
    warpMmPerPixel: number;
  }> {
    const analysisResult = await this.visionService.analyzeImage(file.buffer, file.mimetype, targetType);

    const visionShots: VisionShotResult[] = analysisResult.shots.map((s) => ({
      shotNumber: s.shotNumber,
      score:      s.score,
      x:          s.x,
      y:          s.y,
      pixelX:     500, // Gemini doesn't return exact pixels easily, default to center for UI rendering fallback
      pixelY:     500,
      confidence: 0.95,
      isInnerTen: s.score >= 10.2,
      distMm:     Math.sqrt(s.x * s.x + s.y * s.y),
    }));

    const inputs: ShotInput[] = visionShots.map((vs) => ({
      shotNumber: vs.shotNumber,
      score:      vs.score,
      x:          vs.x,
      y:          vs.y,
    }));

    const savedShots = (persist && analysisResult.targetDetected && inputs.length > 0)
      ? await this.createShots(sessionId, actorId, actorRole, inputs, shooterIdHint)
      : [];

    return {
      shots:            visionShots,
      targetDetected:   analysisResult.targetDetected,
      processingTimeMs: analysisResult.processingTimeMs,
      savedShots,
      warpCenterX: 500,
      warpCenterY: 500,
      warpWidth: 1000,
      warpHeight: 1000,
      warpMmPerPixel: 0.17,
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

  // RING_WIDTH_MM mirrors all supported target types
  private static readonly RING_WIDTH_MM: Record<string, number> = {
    air_rifle_10m:    2.5,
    air_pistol_10m:   8.0,
    air_rifle_50m:    8.0,
    nr_50m:           8.0,
    nr_25m:          25.0,
    issf_300m_rifle: 50.0,
    nra_b8_25yd:     25.4,
    airgun_multi_bull: 2.5,
    field_target_ft: 40.0,
  };

  // ── Method 4: Live Frame from Range Engine ─────────────────────────────────

  /**
   * Called by the range engine (engine/vision_engine.py) or directly by the
   * web app for live-range sessions.  Receives a pre-analysed shot result from
   * the vision service, optionally persists it to the DB, and emits a
   * shot_detected WebSocket event to all clients watching this range.
   */
  async processLiveFrame(payload: {
    rangeId: string;
    sessionId?: string;
    x: number;
    y: number;
    score: number;
    pixelX: number;
    pixelY: number;
    targetType: string;
    confidence?: number;
    timestamp?: number;
  }): Promise<{ saved: boolean; shot: Partial<Shot> }> {
    const shot: Partial<Shot> = {
      score: payload.score,
      x: payload.x,
      y: payload.y,
    };

    // Persist to DB if session is provided
    if (payload.sessionId) {
      try {
        const session = await this.prisma.session.findFirst({
          where: { id: payload.sessionId, deletedAt: null },
          select: { id: true, shooterId: true },
        });
        if (session) {
          const count = await this.prisma.shot.count({ where: { sessionId: payload.sessionId } });
          const created = await this.prisma.shot.create({
            data: {
              sessionId: payload.sessionId,
              shotNumber: count + 1,
              score: payload.score,
              x: payload.x,
              y: payload.y,
            },
          });
          shot.id = created.id;
          shot.sessionId = created.sessionId;
          shot.shotNumber = created.shotNumber;
          shot.timestamp = created.timestamp;
          this.eventsGateway.emitSessionUpdated(payload.sessionId, count + 1);
        }
      } catch (err) {
        // Non-fatal: still emit WS event even if DB save fails
        this.logger.error('[shots] DB save failed for live frame:', err.stack);
      }
    }

    // Always emit shot_detected to the live range room
    this.eventsGateway.emitShotDetected(payload.rangeId, {
      x: payload.x,
      y: payload.y,
      score: payload.score,
      pixelX: payload.pixelX,
      pixelY: payload.pixelY,
      targetType: payload.targetType,
      confidence: payload.confidence ?? 1.0,
      timestamp: payload.timestamp ?? Date.now(),
    });

    return { saved: !!shot.id, shot };
  }

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
