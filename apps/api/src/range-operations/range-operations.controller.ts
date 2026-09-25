import { Controller, Get, Post, Body, Param, Query, Patch, Request, UseGuards, Put } from '@nestjs/common';
import { RangeOperationsService } from './range-operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateLaneStatusDto } from './dto/lane.dto';

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

  @Get(':rangeId/bookings')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF')
  async getBookings(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getBookings(rangeId);
  }

  @Get(':rangeId/schedule-requests')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF')
  async getScheduleRequests(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getScheduleRequests(rangeId);
  }

  @Get(':rangeId/lanes')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async getLanes(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getLanes(rangeId);
  }

  @Patch('lanes/:laneId/status')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async updateLaneStatus(
    @Param('laneId') laneId: string,
    @Body() body: UpdateLaneStatusDto
  ) {
    return this.rangeOperationsService.updateLaneStatus(
      laneId,
      body.status,
      body.shooterId,
      body.sessionType
    );
  }

  @Get(':rangeId/waitlist')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async getWaitlist(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getWaitlist(rangeId);
  }

  @Get(':rangeId/dashboard-stats')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async getDashboardStats(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getDashboardStats(rangeId);
  }

  @Patch(':rangeId/status')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  async updateRangeStatus(
    @Param('rangeId') rangeId: string,
    @Body('status') status: string
  ) {
    return this.rangeOperationsService.updateRangeStatus(rangeId, status);
  }

  @Get(':rangeId/members/search')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF')
  async searchMembers(
    @Param('rangeId') rangeId: string,
    @Query('q') q: string
  ) {
    return this.rangeOperationsService.searchMembers(q);
  }

  @Post(':rangeId/check-in')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'STAFF')
  async checkInMember(
    @Param('rangeId') rangeId: string,
    @Body('userId') userId: string,
    @Body('partySize') partySize: number
  ) {
    return this.rangeOperationsService.checkInMember(rangeId, userId, partySize);
  }

  @Get(':rangeId/incidents')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async getIncidents(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getIncidents(rangeId);
  }

  @Post(':rangeId/incidents')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async createIncident(
    @Param('rangeId') rangeId: string,
    @Body() data: any
  ) {
    return this.rangeOperationsService.createIncident(rangeId, data);
  }

  @Get(':rangeId/rules')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  async getRules(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getSafetyRules(rangeId);
  }

  @Get(':rangeId/staff/shifts')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  async getStaffShifts(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getStaffShifts(rangeId);
  }

  @Get(':rangeId/inventory')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get range inventory' })
  async getInventory(@Param('rangeId') rangeId: string) {
    return this.rangeOperationsService.getInventory(rangeId);
  }

  @Post(':rangeId/inventory')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: 'Add a new inventory item' })
  async addInventoryItem(@Param('rangeId') rangeId: string, @Body() data: any) {
    return this.rangeOperationsService.addInventoryItem(rangeId, data);
  }

  @Put('inventory/:itemId')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: 'Update an inventory item' })
  async updateInventoryItem(@Param('itemId') itemId: string, @Body() data: any) {
    return this.rangeOperationsService.updateInventoryItem(itemId, data);
  }
}

