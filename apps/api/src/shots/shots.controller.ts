// apps/api/src/shots/shots.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShotsService } from './shots.service';
import { ManualShotsDto } from './dto/manual-shots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload, Shot } from '@shooting-platform/shared-types';

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
  @Roles('SHOOTER', 'SOLDIER', 'COACH')
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
  @Roles('SHOOTER', 'SOLDIER', 'COACH')
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
  @Roles('SHOOTER', 'SOLDIER', 'COACH')
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
}
