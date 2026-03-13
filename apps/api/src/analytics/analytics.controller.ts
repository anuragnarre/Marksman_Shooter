// apps/api/src/analytics/analytics.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
  @Roles('SHOOTER', 'SOLDIER')
  async getOverview(@CurrentUser() user: JwtPayload): Promise<OverviewAnalytics> {
    return this.analyticsService.computeOverview(user.sub);
  }

  @Get('session/:id')
  async getSessionAnalytics(@Param('id') id: string): Promise<AnalyticsResult> {
    return this.analyticsService.computeForSession(id);
  }

  @Get('weapons/summary')
  @Roles('SHOOTER', 'SOLDIER')
  async getWeaponSummary(@CurrentUser() user: JwtPayload): Promise<WeaponPerformance[]> {
    return this.analyticsService.computeWeaponSummary(user.sub);
  }
}
