// apps/api/src/sessions/sessions.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload, Session } from '@shooting-platform/shared-types';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles('SHOOTER', 'SOLDIER')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSessionDto,
  ): Promise<Session> {
    return this.sessionsService.create(user.sub, dto);
  }

  @Get()
  @Roles('SHOOTER', 'SOLDIER')
  async findAll(@CurrentUser() user: JwtPayload): Promise<Session[]> {
    return this.sessionsService.findAllForShooter(user.sub);
  }

  @Get(':id')
  @Roles('SHOOTER', 'SOLDIER')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<Session> {
    return this.sessionsService.findOneWithShots(id, user.sub);
  }

  @Delete(':id')
  @Roles('SHOOTER', 'SOLDIER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.sessionsService.softDelete(id, user.sub);
  }
}
