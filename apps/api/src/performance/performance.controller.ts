// apps/api/src/performance/performance.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerformanceService } from './performance.service';
import { SessionContextDto } from './dto/session-context.dto';

@UseGuards(JwtAuthGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('deep-analysis/:sessionId')
  getDeepAnalysis(@Param('sessionId') sessionId: string, @Request() req: any) {
    return this.performanceService.getDeepAnalysis(req.user.sub, sessionId);
  }

  @Post('session-context/:sessionId')
  saveSessionContext(
    @Param('sessionId') sessionId: string,
    @Body() dto: SessionContextDto,
    @Request() req: any,
  ) {
    return this.performanceService.saveSessionContext(req.user.sub, sessionId, dto);
  }

  @Post('training-plan')
  generateTrainingPlan(@Request() req: any) {
    return this.performanceService.generateTrainingPlan(req.user.sub);
  }

  @Get('training-plans')
  getTrainingPlans(@Request() req: any) {
    return this.performanceService.getTrainingPlans(req.user.sub);
  }
}
