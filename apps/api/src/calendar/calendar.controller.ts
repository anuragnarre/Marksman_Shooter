// apps/api/src/calendar/calendar.controller.ts
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@shooting-platform/shared-types';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /** Get events in a date range — coaches see their own, shooters see assigned */
  @Get('events')
  async getEvents(
    @CurrentUser() user: JwtPayload,
    @Query('start') start: string,
    @Query('end')   end:   string,
  ) {
    const s = start || new Date(Date.now() - 30 * 86400000).toISOString();
    const e = end   || new Date(Date.now() + 90 * 86400000).toISOString();

    if (user.role === 'COACH') {
      return this.calendarService.getCoachEvents(user.sub, s, e);
    }
    return this.calendarService.getShooterEvents(user.sub, s, e);
  }

  /** Coach creates an event (with optional recurrence) */
  @Post('events')
  @Roles('COACH', 'SHOOTER')
  async createEvent(@CurrentUser() user: JwtPayload, @Body() dto: CreateEventDto) {
    return this.calendarService.createEvent(user.sub, user.role, dto);
  }

  /** Coach updates a single event */
  @Put('events/:id')
  @Roles('COACH', 'SHOOTER')
  async updateEvent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.calendarService.updateEvent(user.sub, user.role, id, dto);
  }

  /** Coach deletes a single event */
  @Delete('events/:id')
  @Roles('COACH', 'SHOOTER')
  async deleteEvent(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.calendarService.deleteEvent(user.sub, user.role, id);
  }

  /** Coach deletes all events in a recurring group */
  @Delete('events/recurring/:groupId')
  @Roles('COACH', 'SHOOTER')
  async deleteRecurring(
    @CurrentUser() user: JwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.calendarService.deleteRecurringGroup(user.sub, user.role, groupId);
  }

  /** Coach gets their connected shooters (for assignee picker) */
  @Get('shooters')
  @Roles('COACH')
  async getShooters(@CurrentUser() user: JwtPayload) {
    return this.calendarService.getConnectedShooters(user.sub);
  }
}
