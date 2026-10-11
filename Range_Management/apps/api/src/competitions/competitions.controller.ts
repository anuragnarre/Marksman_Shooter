import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompetitionsService } from './competitions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get('rankings')
  getRankings(@Query('discipline') discipline: string) {
    return this.competitionsService.getRankings(discipline);
  }

  @Get('challenges/active')
  getActiveChallenge() {
    return this.competitionsService.getActiveChallenge();
  }
}
