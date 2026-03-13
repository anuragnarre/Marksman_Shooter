// apps/api/src/schedule-requests/schedule-requests.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScheduleRequestsService } from './schedule-requests.service';
import { CreateScheduleRequestDto } from './dto/create-request.dto';
import { ResolveRequestDto } from './dto/resolve-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@shooting-platform/shared-types';

@Controller('schedule-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleRequestsController {
  constructor(private readonly service: ScheduleRequestsService) {}

  /** Shooter submits a change request for an assigned event */
  @Post()
  @Roles('SHOOTER', 'SOLDIER')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateScheduleRequestDto) {
    return this.service.createRequest(user.sub, dto);
  }

  /** Get all requests for the current user (shooter sees own, coach sees incoming) */
  @Get()
  getAll(@CurrentUser() user: JwtPayload) {
    return this.service.getRequests(user.sub, user.role);
  }

  /** Coach: get count of pending requests (for notification badge) */
  @Get('pending-count')
  @Roles('COACH')
  getPendingCount(@CurrentUser() user: JwtPayload) {
    return this.service.getPendingCount(user.sub);
  }

  /** Coach: approve or reject a request */
  @Put(':id/resolve')
  @Roles('COACH')
  resolve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResolveRequestDto,
  ) {
    return this.service.resolveRequest(user.sub, id, dto);
  }

  /** Shooter: cancel a pending request */
  @Delete(':id')
  @Roles('SHOOTER', 'SOLDIER')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.cancelRequest(user.sub, id);
  }
}
