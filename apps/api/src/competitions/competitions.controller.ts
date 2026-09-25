import { Public } from '../auth/decorators/public.decorator';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompetitionsService } from './competitions.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('RANGE_ADMIN', 'RANGE_OPERATOR')
  async createCompetition(@Body() data: any) {
    return this.competitionsService.createCompetition(data);
  }

  @Get()
  async getCompetitions(@Query('status') status?: string) {
    return this.competitionsService.getCompetitions(status);
  }

  @Get('rankings')
  getRankings(@Query('discipline') discipline: string) {
    return this.competitionsService.getRankings(discipline);
  }

  @Get('challenges/active')
  getActiveChallenge() {
    return this.competitionsService.getActiveChallenge();
  }

  @Get(':id')
  async getCompetition(@Param('id') id: string) {
    return this.competitionsService.getCompetition(id);
  }

  @Post(':id/entries')
  async enterCompetition(
    @Param('id') id: string,
    @Body('categoryId') categoryId: string,
    @Req() req: any
  ) {
    return this.competitionsService.enterCompetition(id, categoryId, req.user.id);
  }

  @Post(':id/batch-entries')
  @UseGuards(RolesGuard)
  @Roles('COACH')
  async coachBatchEntry(
    @Param('id') id: string,
    @Body('categoryId') categoryId: string,
    @Body('shooterIds') shooterIds: string[],
    @Req() req: any
  ) {
    return this.competitionsService.coachBatchEntry(id, categoryId, req.user.id, shooterIds);
  }

  @Public()
  @Get(':id/scoreboard')
  async getScoreboard(@Param('id') id: string) {
    return this.competitionsService.getScoreboard(id);
  }

  @Post(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles('RANGE_ADMIN', 'RANGE_OPERATOR')
  async finalizeCompetition(@Param('id') id: string) {
    return this.competitionsService.finalizeCompetition(id);
  }

  @Get('entries/:entryId/vs-training')
  async getTrainingDelta(@Param('entryId') entryId: string) {
    return this.competitionsService.getTrainingDelta(entryId);
  }
}

