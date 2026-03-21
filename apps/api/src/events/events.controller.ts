import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RegisterEventDto } from './dto/register-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@shooting-platform/shared-types';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ── Public endpoints ─────────────────────────────────────────────────────

  @Get()
  findAllPublished() {
    return this.eventsService.findAllPublished();
  }

  @Get('upcoming')
  getUpcoming() {
    return this.eventsService.getUpcomingPublished();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOnePublished(id);
  }

  // ── Authenticated endpoints ──────────────────────────────────────────────

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  register(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterEventDto,
  ) {
    return this.eventsService.register(id, user.sub, dto);
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getRegistrations(@Param('id') id: string) {
    return this.eventsService.getRegistrations(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.create(dto, user.sub);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.eventsService.findAll();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.eventsService.delete(id);
  }
}
