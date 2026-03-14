// apps/api/src/analytics/analytics.controller.ts
import { Controller, Get, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsResult, JwtPayload, OverviewAnalytics, WeaponPerformance } from '@shooting-platform/shared-types';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('SHOOTER', 'SOLDIER', 'COACH')
  async getOverview(
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<OverviewAnalytics> {
    if (user.role === 'COACH' && !shooterId) {
      throw new BadRequestException('shooterId is required for coach overview');
    }
    return this.analyticsService.computeOverviewForActor(user.sub, user.role, shooterId);
  }

  @Get('session/:id')
  @Roles('SHOOTER', 'SOLDIER', 'COACH')
  async getSessionAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<AnalyticsResult> {
    return this.analyticsService.computeForSessionForActor(user.sub, user.role, id);
  }

  @Get('weapons/summary')
  @Roles('SHOOTER', 'SOLDIER', 'COACH')
  async getWeaponSummary(
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<WeaponPerformance[]> {
    if (user.role === 'COACH' && !shooterId) {
      throw new BadRequestException('shooterId is required for coach weapon summary');
    }
    return this.analyticsService.computeWeaponSummaryForActor(user.sub, user.role, shooterId);
  }
}
