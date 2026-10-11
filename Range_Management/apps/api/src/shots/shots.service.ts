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

    if (analysisResult.shots.length === 0) {
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
      warp_center_x?: number;
      warp_center_y?: number;
      warp_width?: number;
      warp_height?: number;
      warp_mm_per_pixel?: number;
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

    const warpMeta = {
      warpCenterX:   raw.warp_center_x   ?? 500,
      warpCenterY:   raw.warp_center_y   ?? 500,
      warpWidth:     raw.warp_width      ?? 1000,
      warpHeight:    raw.warp_height     ?? 1000,
      warpMmPerPixel: raw.warp_mm_per_pixel ?? 0.17,
    };

    if (visionShots.length === 0) {
      return {
        shots:            [],
        targetDetected:   raw.target_detected,
        processingTimeMs: raw.processing_time_ms,
        savedShots:       [],
        ...warpMeta,
      };
    }

    const savedShots = persist
      ? await this.createShots(sessionId, actorId, actorRole, inputs, shooterIdHint)
      : [];

    return {
      shots:            visionShots,
      targetDetected:   raw.target_detected,
      processingTimeMs: raw.processing_time_ms,
      savedShots,
      ...warpMeta,
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
        console.error('[shots] DB save failed for live frame:', err);
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
    } as any);

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
