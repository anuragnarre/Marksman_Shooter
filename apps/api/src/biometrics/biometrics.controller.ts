// apps/api/src/biometrics/biometrics.controller.ts
import {
  Controller, Post, Get, Patch, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DeviceAuthGuard } from './guards/device-auth.guard';
import { BiometricsService } from './biometrics.service';
import { BiometricsAiService } from './biometrics-ai.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { VitalsPayloadDto } from './dto/vitals-payload.dto';
import { HealthConnectSyncDto } from './dto/health-connect-sync.dto';
import type { JwtPayload } from '@shooting-platform/shared-types';

@Controller('biometrics')
export class BiometricsController {
  constructor(
    private readonly biometricsService: BiometricsService,
    private readonly biometricsAiService: BiometricsAiService,
  ) {}

  // ── Device Management (JWT auth) ─────────────────────────────────────────

  @Post('devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async registerDevice(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.biometricsService.registerDevice(user.sub, dto.deviceName, dto.deviceType);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async listDevices(@CurrentUser() user: JwtPayload) {
    return this.biometricsService.listDevices(user.sub);
  }

  @Patch('devices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async toggleDevice(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.biometricsService.toggleDevice(user.sub, id, isActive);
  }

  @Delete('devices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async deleteDevice(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.biometricsService.deleteDevice(user.sub, id);
  }

  @Get('devices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async getDeviceDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.biometricsService.getDeviceDetail(user.sub, id);
  }

  // ── Arduino Vitals Ingestion (Device key auth) ────────────────────────────

  @Post('vitals')
  @UseGuards(DeviceAuthGuard)
  @HttpCode(201)
  async ingestVitals(@Req() req: any, @Body() dto: VitalsPayloadDto) {
    return this.biometricsService.ingestVitals(
      req.device.id,
      req.deviceUserId,
      dto.type ?? 'quick_estimate',
      dto.heartRate,
      dto.spo2,
    );
  }

  // ── Health Connect Sync (JWT auth) ────────────────────────────────────────

  @Post('health-connect/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async syncHealthConnect(
    @CurrentUser() user: JwtPayload,
    @Body() dto: HealthConnectSyncDto,
  ) {
    return this.biometricsService.syncHealthConnect(user.sub, dto.readings, dto.sessionId);
  }

  // ── Readings Query (JWT auth) ─────────────────────────────────────────────

  @Get('readings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async getReadings(
    @CurrentUser() user: JwtPayload,
    @Query('sessionId') sessionId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.biometricsService.getReadings(user.sub, {
      sessionId, deviceId, from, to,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ── Session Summary ───────────────────────────────────────────────────────

  @Get('session/:sessionId/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async getSessionSummary(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.biometricsService.getSessionSummary(sessionId, user.sub);
  }

  // ── AI Biometric Analysis ─────────────────────────────────────────────────

  @Get('session/:sessionId/ai-analysis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async getAiAnalysis(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.biometricsAiService.analyzeSessionBiometrics(sessionId, user.sub);
  }

  // ── Advanced Insights ────────────────────────────────────────────────────

  @Get('advanced-insights')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async getAdvancedInsights(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.biometricsAiService.generateAdvancedInsights(
      user.sub,
      days ? parseInt(days, 10) : 30,
    );
  }

  // ── Trends ────────────────────────────────────────────────────────────────

  @Get('trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async getTrends(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.biometricsService.getTrends(user.sub, days ? parseInt(days, 10) : 30);
  }

  // ── Live (Latest Reading) ─────────────────────────────────────────────────

  @Get('live/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async getLatestReading(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    // Only allow users to read their own biometrics (or coaches with a relationship)
    if (user.sub !== userId && user.role !== 'COACH') {
      throw new ForbiddenException('Cannot access another user\'s biometric data');
    }
    return this.biometricsService.getLatestReading(userId);
  }
}
