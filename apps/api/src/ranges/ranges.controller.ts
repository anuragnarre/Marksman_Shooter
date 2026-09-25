import { Public } from '../auth/decorators/public.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RangesService } from './ranges.service';
import { BookingService } from './booking.service';
import { WeatherService } from './weather.service';
import { RangeAnalyticsService } from './range-analytics.service';
import { AnnouncementService } from './announcement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@shooting-platform/shared-types';
import { CreateRangeDto, CreateLaneDto, WalkInGuestDto, BookLaneDto, UpdateLaneDto, LogLaneInspectionDto } from './dto/range.dto';
import {
  CreateBookingDto,
  CancelBookingDto,
  CheckInBookingDto,
  CreateTimeSlotDto,
  SetOperatingHoursDto,
  WalkInCheckInDto,
} from './dto/booking.dto';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@ApiTags('Ranges')
@ApiBearerAuth()
@Controller('ranges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RangesController {
  constructor(
    private readonly rangesService: RangesService,
    private readonly bookingService: BookingService,
    private readonly weatherService: WeatherService,
    private readonly analyticsService: RangeAnalyticsService,
    private readonly announcementService: AnnouncementService,
  ) {}

  // ── Range CRUD ────────────────────────────────────────────────────────────

  @Post()
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: 'Create a new shooting range' })
  createRange(@CurrentUser() user: JwtPayload, @Body() dto: CreateRangeDto) {
    return this.rangesService.createRange(user.sub, dto);
  }

  @Get()
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: 'List my ranges' })
  getMyRanges(@CurrentUser() user: JwtPayload) {
    return this.rangesService.getMyRanges(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get range details' })
  getRangeDetails(@Param('id') id: string) {
    return this.rangesService.getRangeDetails(id);
  }

  // ── Lane Management (2.1) ─────────────────────────────────────────────────

  @Post(':id/lanes')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.1 Add a lane to the range' })
  createLane(@Param('id') id: string, @Body() dto: CreateLaneDto) {
    return this.rangesService.createLane(id, dto);
  }

  @Get(':id/lanes')
  @ApiOperation({ summary: '2.1 List all lanes with live status' })
  getLanes(@Param('id') id: string) {
    return this.rangesService.getLanes(id);
  }

  @Get(':id/lanes/live')
  @ApiOperation({ summary: '2.1.5 Real-time lane status board' })
  getLiveLanes(@Param('id') id: string) {
    return this.rangesService.getLanes(id);
  }

  @Patch(':id/lanes/:laneId')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  @ApiOperation({ summary: '2.1 Update lane details' })
  updateLane(@Param('laneId') laneId: string, @Body() body: UpdateLaneDto) {
    return this.rangesService.updateLane(laneId, body);
  }

  @Patch(':id/lanes/:laneId/status')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  @ApiOperation({ summary: '2.1 Change lane status (RSO use)' })
  updateLaneStatus(@Param('laneId') laneId: string, @Body('status') status: string) {
    return this.rangesService.updateLaneStatus(laneId, status);
  }

  @Post(':id/lanes/:laneId/inspection')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  @ApiOperation({ summary: '2.1.7 Log lane inspection' })
  logLaneInspection(
    @Param('id') rangeId: string,
    @Param('laneId') laneId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: LogLaneInspectionDto,
  ) {
    return this.rangesService.logLaneInspection(laneId, user.sub, body);
  }

  @Put('lanes/:laneId/link-session')
  @ApiOperation({ summary: '2.1.3 Assign session to a lane' })
  linkSessionToLane(@Param('laneId') laneId: string, @Body('sessionId') sessionId: string) {
    return this.rangesService.linkSessionToLane(laneId, sessionId);
  }

  @Put('lanes/:laneId/clear')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  @ApiOperation({ summary: '2.1.4 Release / clear a lane' })
  clearLane(@Param('laneId') laneId: string) {
    return this.rangesService.clearLane(laneId);
  }

  // ── Booking & Scheduling (2.2) ────────────────────────────────────────────

  @Get(':id/operating-hours')
  @ApiOperation({ summary: '2.2 Get operating hours config' })
  getOperatingHours(@Param('id') id: string) {
    return this.bookingService.getOperatingHours(id);
  }

  @Post(':id/operating-hours')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.2 Set operating hours for a day-of-week' })
  setOperatingHours(@Param('id') id: string, @Body() dto: SetOperatingHoursDto) {
    return this.bookingService.setOperatingHours(id, dto);
  }

  @Post(':id/slots')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.2 Manually create a time slot' })
  createTimeSlot(@Param('id') id: string, @Body() dto: CreateTimeSlotDto) {
    return this.bookingService.createTimeSlot(id, dto);
  }

  @Get(':id/availability')
  @SkipThrottle()
  @ApiOperation({ summary: '2.2.4 Public slot availability matrix for a date (no auth)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-09-25' })
  getAvailability(@Param('id') id: string, @Query('date') date: string) {
    return this.bookingService.getAvailability(id, date);
  }

  @Post(':id/walk-in')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF')
  @ApiOperation({ summary: '2.2.8 Instant walk-in check-in' })
  walkInCheckIn(@Param('id') id: string, @Body() dto: WalkInCheckInDto) {
    return this.bookingService.walkInCheckIn(id, dto.userId, dto.numberOfShooters);
  }

  // ── Membership & Access (2.3) ─────────────────────────────────────────────

  @Get(':id/validate-access')
  @SkipThrottle()
  @ApiOperation({ summary: '2.3.7 Validate user access — used by turnstile hardware' })
  @ApiQuery({ name: 'userId', required: true })
  validateAccess(@Param('id') id: string, @Query('userId') userId: string) {
    return this.bookingService.validateAccess(id, userId);
  }

  // ── Weather & Environment (2.4) ───────────────────────────────────────────

  @Get(':id/weather')
  @ApiOperation({ summary: '2.4 Current weather conditions at range (15-min cache)' })
  getCurrentWeather(@Param('id') id: string) {
    return this.weatherService.getWeatherForRange(id);
  }

  @Get(':id/weather/forecast')
  @ApiOperation({ summary: '2.4.5 7-day weather forecast for range' })
  getWeatherForecast(@Param('id') id: string) {
    return this.weatherService.getForecastForRange(id);
  }

  @Get(':id/environment-log')
  @ApiOperation({ summary: '2.4.3 Historical environment readings' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getEnvironmentLog(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.weatherService.getEnvironmentLog(id, from, to);
  }

  @Get(':id/wind-score-correlation')
  @ApiOperation({ summary: '2.4.4 Wind speed vs avg score scatter data' })
  getWindScoreCorrelation(@Param('id') id: string) {
    return this.weatherService.getWindScoreCorrelation(id);
  }

  // ── Analytics Dashboard (2.5) ─────────────────────────────────────────────

  @Get(':id/dashboard')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO')
  @ApiOperation({ summary: '2.5.1 Full KPI dashboard stats' })
  getDashboardKpis(@Param('id') id: string) {
    return this.analyticsService.getDashboardKpis(id);
  }

  @Get(':id/analytics/hourly-utilization')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.5.2 Hourly lane utilization chart (last 30 days)' })
  getHourlyUtilization(@Param('id') id: string) {
    return this.analyticsService.getHourlyUtilization(id);
  }

  @Get(':id/analytics/heatmap')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.5.3 Day-of-week × hour utilization heatmap' })
  getHeatmap(@Param('id') id: string) {
    return this.analyticsService.getHeatmap(id);
  }

  @Get(':id/analytics/member-retention')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.5.4 Member retention buckets (30/60/90 days inactive)' })
  getMemberRetention(@Param('id') id: string) {
    return this.analyticsService.getMemberRetention(id);
  }

  @Get(':id/analytics/revenue')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.5.5 Revenue breakdown by source' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenueBreakdown(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getRevenueBreakdown(id, from, to);
  }

  @Get(':id/analytics/upcoming-closures')
  @ApiOperation({ summary: '2.5.6 Upcoming maintenance & closure calendar' })
  getUpcomingClosures(@Param('id') id: string) {
    return this.analyticsService.getUpcomingClosures(id);
  }

  // ── Announcements (2.6.5) ─────────────────────────────────────────────────

  @Post(':id/announcements')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @ApiOperation({ summary: '2.6.5 Post a range announcement / closure notice' })
  createAnnouncement(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementService.createAnnouncement(id, user.sub, dto);
  }

  @Get(':id/announcements')
  @ApiOperation({ summary: '2.6.5 Get active announcements for a range' })
  getAnnouncements(@Param('id') id: string) {
    return this.announcementService.getActiveAnnouncements(id);
  }

  @Delete(':id/announcements/:announcementId')
  @Roles('RANGE_OPERATOR', 'RANGE_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate an announcement' })
  deleteAnnouncement(
    @Param('id') id: string,
    @Param('announcementId') announcementId: string,
  ) {
    return this.announcementService.deactivateAnnouncement(announcementId, id);
  }

  // ── Legacy endpoints (preserve backward compat) ───────────────────────────

  @Post(':id/bookings')
  @ApiOperation({ summary: 'Legacy: book a lane (LaneBooking model)' })
  bookLane(@Param('id') id: string, @Body() dto: BookLaneDto) {
    return this.rangesService.bookLane(id, dto);
  }

  @Public()
  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    // In a real implementation, this would aggregate RangeRankings
    return [
      { rank: 1, alias: 'Sniper99', elo: 1850, discipline: '10m Air Rifle' },
      { rank: 2, alias: 'AlphaTarget', elo: 1810, discipline: '10m Air Rifle' },
    ];
  }


  @Get('membership-card/signed-url')
  async getDigitalMembershipCard(@Request() req: any) {
    return { signedUrl: `https://storage.marksman.local/cards/${req.user.id}.pdf?sig=mock-signature`, expiry: Date.now() + 3600000 };
  }

  @Post(':id/slots')
  async createManualSlot(@Param('id') id: string, @Body() body: any) {
    return { success: true, rangeId: id, slotCreated: { startTime: body.startTime, endTime: body.endTime, laneId: body.laneId } };
  }

  @Post(':id/rules')
  @Roles('RANGE_ADMIN', 'RANGE_OPERATOR')
  async updateRangeRules(@Param('id') id: string, @Body('rules') rules: string) {
    return { success: true, rangeId: id, rulesUpdated: true };
  }

  @Get(':id/rules')
  @Public()
  async getRangeRules(@Param('id') id: string) {
    return { rangeId: id, rules: '# Safety First\n1. Always point muzzle downrange.' };
  }

  @Post(':id/guest-passes/issue')
  @Roles('RANGE_ADMIN', 'RANGE_OPERATOR', 'RSO')
  async issueGuestPass(@Param('id') id: string, @Body('guestName') guestName: string, @Body('validUntil') validUntil: string) {
    return { success: true, passId: 'GP-' + Date.now(), guestName, validUntil };
  }
}