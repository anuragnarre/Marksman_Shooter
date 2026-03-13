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
import { Shot, ShotInput } from '@shooting-platform/shared-types';

@Injectable()
export class ShotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ── Shared creation method (all 3 input methods funnel here) ───────────────

  async createShots(
    sessionId: string,
    shooterId: string,
    shots: ShotInput[],
  ): Promise<Shot[]> {
    if (shots.length === 0) {
      throw new BadRequestException('No shots provided');
    }

    // Verify session ownership
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, shooterId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found or access denied`);
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
    shooterId: string,
    file: Express.Multer.File,
  ): Promise<Shot[]> {
    const shots = await parseFile(file.buffer, file.mimetype, file.originalname);
    return this.createShots(sessionId, shooterId, shots);
  }

  // ── Method 2: Manual Entry ─────────────────────────────────────────────────

  async createManual(
    dto: ManualShotsDto,
    shooterId: string,
  ): Promise<Shot[]> {
    return this.createShots(dto.sessionId, shooterId, dto.shots);
  }

  // ── Method 3: Photo Analysis via Vision Service ────────────────────────────

  async analyzePhoto(
    sessionId: string,
    shooterId: string,
    file: Express.Multer.File,
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

    return this.createShots(sessionId, shooterId, shots);
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
}
