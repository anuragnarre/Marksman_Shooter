import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('range-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RANGE_ADMIN')
export class RangeAdminController {
  @Get('dashboard')
  async getDashboard() {
    return {
      totalRanges: 1,
      totalUsers: 1500,
      activeIncidents: 0,
      financialSummary: { revenue: 50000, currency: 'USD' }
    };
  }
}
