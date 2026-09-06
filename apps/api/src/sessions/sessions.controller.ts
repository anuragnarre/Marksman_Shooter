// apps/api/src/sessions/sessions.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload, Session } from '@shooting-platform/shared-types';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles('SHOOTER', 'COACH')
  @ApiOperation({ summary: 'Create a new shooting session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiQuery({ name: 'shooterId', required: false, description: 'Required for coaches creating a session for a shooter' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
    @Body() dto: CreateSessionDto,
  ): Promise<Session> {
    if (user.role === 'COACH' && !shooterId) {
      throw new BadRequestException('shooterId is required for coach-created sessions');
    }
    return this.sessionsService.createForActor(user.sub, user.role, dto, shooterId);
  }

  @Get()
  @Roles('SHOOTER', 'COACH')
  @ApiOperation({ summary: 'Get all shooting sessions' })
  @ApiResponse({ status: 200, description: 'List of sessions' })
  @ApiQuery({ name: 'shooterId', required: false, description: 'Required for coaches fetching sessions for a shooter' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<Session[]> {
    if (user.role === 'COACH' && !shooterId) {
      throw new BadRequestException('shooterId is required for coach session listing');
    }
    return this.sessionsService.findAllForActor(user.sub, user.role, shooterId);
  }

  @Get(':id')
  @Roles('SHOOTER', 'COACH')
  @ApiOperation({ summary: 'Get a specific shooting session with shots' })
  @ApiResponse({ status: 200, description: 'Session with its shots' })
  @ApiQuery({ name: 'shooterId', required: false })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<Session> {
    return this.sessionsService.findOneWithShotsForActor(id, user.sub, user.role, shooterId);
  }

  @Delete(':id')
  @Roles('SHOOTER', 'COACH')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a shooting session' })
  @ApiResponse({ status: 204, description: 'Session successfully deleted' })
  @ApiQuery({ name: 'shooterId', required: false })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('shooterId') shooterId: string | undefined,
  ): Promise<void> {
    return this.sessionsService.softDeleteForActor(id, user.sub, user.role, shooterId);
  }
}
