// apps/api/src/performance/performance.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PerformanceService } from './performance.service';
import { SessionContextDto } from './dto/session-context.dto';
import { JwtPayload } from '@shooting-platform/shared-types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('deep-analysis/:sessionId')
  @Roles('SHOOTER', 'COACH')
  getDeepAnalysis(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ) {
    return this.performanceService.getDeepAnalysis(user.sub, sessionId, user.role, shooterId);
  }

  @Post('session-context/:sessionId')
  @Roles('SHOOTER', 'COACH')
  saveSessionContext(
    @Param('sessionId') sessionId: string,
    @Body() dto: SessionContextDto,
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ) {
    return this.performanceService.saveSessionContext(user.sub, sessionId, dto, user.role, shooterId);
  }

  @Post('training-plan')
  @Roles('SHOOTER', 'COACH')
  generateTrainingPlan(
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ) {
    if (user.role === 'COACH' && !shooterId) {
      throw new BadRequestException('shooterId is required for coach training plans');
    }
    return this.performanceService.generateTrainingPlan(user.sub, user.role, shooterId);
  }

  @Get('training-plans')
  @Roles('SHOOTER', 'COACH')
  getTrainingPlans(
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ) {
    if (user.role === 'COACH' && !shooterId) {
      throw new BadRequestException('shooterId is required for coach training plans');
    }
    return this.performanceService.getTrainingPlans(user.sub, user.role, shooterId);
  }
}
