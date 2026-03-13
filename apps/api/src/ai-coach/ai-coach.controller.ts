// apps/api/src/ai-coach/ai-coach.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiCoachService } from './ai-coach.service';
import { AnalyzeSessionDto } from './dto/analyze-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiCoachAnalysis, JwtPayload } from '@shooting-platform/shared-types';

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
}
