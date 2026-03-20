// apps/api/src/ai-coach/ai-coach.controller.ts
import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AiCoachService } from './ai-coach.service';
import { AnalyzeSessionDto } from './dto/analyze-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiCoachAnalysis, AiPerformanceAssistant, JwtPayload } from '@shooting-platform/shared-types';

@Controller('ai-coach')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiCoachController {
  constructor(private readonly aiCoachService: AiCoachService) {}

  /** Analyse a session and return AI coaching feedback. */
  @Post('analyze')
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async analyzeSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AnalyzeSessionDto,
  ): Promise<AiCoachAnalysis> {
    return this.aiCoachService.analyzeSession(dto.sessionId, user.sub, user.role);
  }

  /** Comprehensive AI performance assistant — analyses entire shooting history. */
  @Post('performance-assistant')
  @Roles('SHOOTER', 'COACH', 'SOLDIER')
  async performanceAssistant(
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<AiPerformanceAssistant> {
    return this.aiCoachService.analyzePerformance(user.sub, user.role, shooterId);
  }
}
