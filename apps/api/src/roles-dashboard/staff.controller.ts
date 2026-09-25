import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF')
export class StaffController {
  @Post('check-in')
  async checkInShooter(@Body('shooterId') shooterId: string) {
    return { message: `Shooter ${shooterId} checked in successfully.`, timestamp: new Date() };
  }

  @Post('issue-day-pass')
  async issueDayPass(@Body('name') name: string) {
    return { passCode: 'DP-2026-XQ', validUntil: new Date(Date.now() + 86400000) };
  }
}
