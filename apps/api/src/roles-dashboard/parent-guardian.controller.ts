import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@shooting-platform/shared-types';

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARENT_GUARDIAN')
export class ParentGuardianController {
  @Get('digest')
  async getWeeklyDigest(@CurrentUser() user: JwtPayload) {
    return {
      message: 'Weekly digest for your childs activities.',
      sessionsCompleted: 4,
      totalShots: 200,
      averageScore: 9.8
    };
  }
}
