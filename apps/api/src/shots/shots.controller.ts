// apps/api/src/shots/shots.controller.ts
import {
  Controller,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShotsService } from './shots.service';
import { ManualShotsDto } from './dto/manual-shots.dto';
import { UpdateShotDto } from './dto/update-shot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload, Shot, VisionShotResult } from '@shooting-platform/shared-types';

@Controller('shots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShotsController {
  constructor(private readonly shotsService: ShotsService) {}

  /**
   * Method 1 — File Import
   * POST /shots/import
   * multipart/form-data with field "file" (PDF | CSV | JSON) and query param sessionId
   */
  @Post('import')
  @Roles('SHOOTER', 'COACH')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async importFromFile(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('sessionId') sessionId: string,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<Shot[]> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!sessionId) {
      throw new BadRequestException('sessionId query parameter is required');
    }
    return this.shotsService.importFromFile(sessionId, user.sub, user.role, file, shooterId);
  }

  /**
   * Method 2 — Manual Entry
   * POST /shots/manual
   * JSON body with sessionId and shots array
   */
  @Post('manual')
  @Roles('SHOOTER', 'COACH')
  async createManual(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ManualShotsDto,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<Shot[]> {
    return this.shotsService.createManual(dto, user.sub, user.role, shooterId);
  }

  /**
   * Method 3 — Photo Analysis
   * POST /shots/photo
   * multipart/form-data with field "file" (image) and query param sessionId
   */
  @Post('photo')
  @Roles('SHOOTER', 'COACH')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are accepted'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async analyzePhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('sessionId') sessionId: string,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<Shot[]> {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    if (!sessionId) {
      throw new BadRequestException('sessionId query parameter is required');
    }
    return this.shotsService.analyzePhoto(sessionId, user.sub, user.role, file, shooterId);
  }

  /**
   * Method 3b — Photo Analysis (full vision response)
   * POST /shots/analyze-photo
   * Returns VisionShotResult[] with pixel coords, plus targetDetected and processingTimeMs.
   */
  @Post('analyze-photo')
  @Roles('SHOOTER', 'COACH')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are accepted'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async analyzePhotoFull(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('sessionId') sessionId: string,
    @Query('targetType') targetType: string | undefined,
    @Query('shooterId') shooterId: string | undefined,
    @Query('save') save?: string,
  ): Promise<{ shots: VisionShotResult[]; targetDetected: boolean; processingTimeMs: number; savedShots: Shot[]; warpCenterX: number; warpCenterY: number; warpWidth: number; warpHeight: number; warpMmPerPixel: number }> {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    if (!sessionId) {
      throw new BadRequestException('sessionId query parameter is required');
    }
    return this.shotsService.analyzePhotoFull(
      sessionId,
      user.sub,
      user.role,
      file,
      targetType ?? 'air_rifle_10m',
      shooterId,
      save !== 'false',
    );
  }

  /**
   * DELETE /shots/:id
   * Remove a single shot. Emits session.updated WebSocket event.
   */
  @Delete(':id')
  @Roles('SHOOTER', 'COACH')
  async deleteShot(
    @CurrentUser() user: JwtPayload,
    @Param('id') shotId: string,
  ): Promise<{ deleted: boolean }> {
    return this.shotsService.deleteShot(shotId, user.sub, user.role);
  }

  /**
   * PATCH /shots/:id
   * Update x/y position (mm from center, ±15mm). Recalculates score server-side.
   */
  @Patch(':id')
  @Roles('SHOOTER', 'COACH')
  async updateShot(
    @CurrentUser() user: JwtPayload,
    @Param('id') shotId: string,
    @Body() dto: UpdateShotDto,
  ): Promise<Shot> {
    return this.shotsService.updateShot(shotId, user.sub, user.role, dto);
  }
}
