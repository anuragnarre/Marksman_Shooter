// apps/api/src/coach/coach.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoachService } from './coach.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { InviteShooterDto } from './dto/invite-shooter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CoachConnection,
  CoachFeedback,
  JwtPayload,
  Session,
  User,
} from '@shooting-platform/shared-types';

@Controller('coach')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  // ── Shooter-initiated flow ────────────────────────────────────────────────

  /** Shooter sends a connection request to a coach. */
  @Post('connect')
  @Roles('SHOOTER')
  async requestConnection(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConnectionDto,
  ): Promise<CoachConnection> {
    return this.coachService.requestConnection(user.sub, dto);
  }

  /** Coach approves a shooter-initiated pending request. */
  @Patch('connect/:id/approve')
  @Roles('COACH')
  async approveConnection(
    @CurrentUser() user: JwtPayload,
    @Param('id') connectionId: string,
  ): Promise<CoachConnection> {
    return this.coachService.approveConnection(connectionId, user.sub);
  }

  /** Coach rejects a shooter-initiated pending request. */
  @Patch('connect/:id/reject')
  @Roles('COACH')
  async rejectConnection(
    @CurrentUser() user: JwtPayload,
    @Param('id') connectionId: string,
  ): Promise<CoachConnection> {
    return this.coachService.rejectConnection(connectionId, user.sub);
  }

  /** Coach views pending requests initiated by shooters. */
  @Get('requests')
  @Roles('COACH')
  async getPendingRequests(
    @CurrentUser() user: JwtPayload,
  ): Promise<CoachConnection[]> {
    return this.coachService.getPendingRequests(user.sub);
  }

  // ── Coach-initiated invite flow ───────────────────────────────────────────

  /** Coach searches for a shooter by email before inviting. */
  @Get('shooters/search')
  @Roles('COACH')
  async searchShooter(
    @Query('email') email: string,
  ): Promise<User | null> {
    return this.coachService.findShooterByEmail(email);
  }

  /** Coach sends an invitation to a specific shooter. */
  @Post('invite')
  @Roles('COACH')
  async inviteShooter(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteShooterDto,
  ): Promise<CoachConnection> {
    return this.coachService.inviteShooter(user.sub, dto);
  }

  /** Coach views their outgoing invites. */
  @Get('outgoing-invites')
  @Roles('COACH')
  async getOutgoingInvites(
    @CurrentUser() user: JwtPayload,
  ): Promise<CoachConnection[]> {
    return this.coachService.getOutgoingInvites(user.sub);
  }

  /** Coach cancels a pending outgoing invite. */
  @Delete('invite/:id')
  @Roles('COACH')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelInvite(
    @CurrentUser() user: JwtPayload,
    @Param('id') connectionId: string,
  ): Promise<void> {
    return this.coachService.cancelInvite(connectionId, user.sub);
  }

  // ── Shooter approval flow (for coach-initiated invites) ───────────────────

  /** Shooter views pending invites from coaches. */
  @Get('incoming-invites')
  @Roles('SHOOTER')
  async getIncomingInvites(
    @CurrentUser() user: JwtPayload,
  ): Promise<CoachConnection[]> {
    return this.coachService.getIncomingInvites(user.sub);
  }

  /** Shooter approves a coach-initiated invite. */
  @Patch('invite/:id/approve')
  @Roles('SHOOTER')
  async approveInvite(
    @CurrentUser() user: JwtPayload,
    @Param('id') connectionId: string,
  ): Promise<CoachConnection> {
    return this.coachService.approveInvite(connectionId, user.sub);
  }

  /** Shooter rejects a coach-initiated invite. */
  @Patch('invite/:id/reject')
  @Roles('SHOOTER')
  async rejectInvite(
    @CurrentUser() user: JwtPayload,
    @Param('id') connectionId: string,
  ): Promise<CoachConnection> {
    return this.coachService.rejectInvite(connectionId, user.sub);
  }

  // ── Shared read methods ───────────────────────────────────────────────────

  /** Shooter lists all coaches available to connect with. */
  @Get('coaches')
  @Roles('SHOOTER')
  async getAvailableCoaches(): Promise<User[]> {
    return this.coachService.getAvailableCoaches();
  }

  /** Shooter views all their connections (both directions, all statuses). */
  @Get('my-connections')
  @Roles('SHOOTER')
  async getMyConnections(
    @CurrentUser() user: JwtPayload,
  ): Promise<CoachConnection[]> {
    return this.coachService.getMyConnections(user.sub);
  }

  /** Coach lists all approved shooters. */
  @Get('shooters')
  @Roles('COACH')
  async getMyShooters(@CurrentUser() user: JwtPayload): Promise<User[]> {
    return this.coachService.getMyShooters(user.sub);
  }

  /** Coach views a specific shooter's sessions. */
  @Get('shooters/:shooterId/sessions')
  @Roles('COACH')
  async getShooterSessions(
    @CurrentUser() user: JwtPayload,
    @Param('shooterId') shooterId: string,
  ): Promise<Session[]> {
    return this.coachService.getShooterSessions(shooterId, user.sub);
  }

  /** Coach posts feedback on a session. */
  @Post('feedback')
  @Roles('COACH')
  async addFeedback(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFeedbackDto,
  ): Promise<CoachFeedback> {
    return this.coachService.addFeedback(user.sub, dto);
  }
}
