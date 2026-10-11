import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('planning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('drills')
  async getDrills() {
    return this.planningService.getDrills();
  }

  @Post('session-plan')
  async saveSessionPlan(@Request() req: any, @Body() data: any) {
    return this.planningService.saveSessionPlan(req.user.sub, data);
  }

  @Get('session-plan/:shooterId')
  async getSessionPlan(@Param('shooterId') shooterId: string) {
    return this.planningService.getSessionPlan(shooterId);
  }
}
