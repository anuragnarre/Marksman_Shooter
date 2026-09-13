import { Controller, Get, Post, Body, Param, Query, Patch, Request, UseGuards } from '@nestjs/common';
import { RangeOperationsService } from './range-operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('range-operations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RangeOperationsController {
  constructor(private readonly rangeOperationsService: RangeOperationsService) {}

  @Get(':rangeId/staff/shifts')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async getShifts(
    @Param('rangeId') rangeId: string,
    @Query('start') start: string,
    @Query('end') end: string
  ) {
    return this.rangeOperationsService.getStaffShifts(rangeId, start, end);
  }

  @Post(':rangeId/staff/shifts')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  async createShift(
    @Param('rangeId') rangeId: string,
    @Body() data: any
  ) {
    return this.rangeOperationsService.createStaffShift(rangeId, data);
  }

  @Patch('staff/shifts/:shiftId/clock-in')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF')
  async clockIn(@Param('shiftId') shiftId: string, @Request() req: any) {
    return this.rangeOperationsService.clockInStaff(shiftId, req.user.id);
  }

  @Patch('staff/shifts/:shiftId/clock-out')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF')
  async clockOut(@Param('shiftId') shiftId: string, @Request() req: any) {
    return this.rangeOperationsService.clockOutStaff(shiftId, req.user.id);
  }
}
