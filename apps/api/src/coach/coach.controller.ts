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
import { CreateManagedShooterDto } from './dto/create-managed-shooter.dto';
import { UpdateManagedShooterDto } from './dto/update-managed-shooter.dto';
import { CreateManagedShotsDto } from './dto/create-managed-shots.dto';
import { CreateSessionDto } from '../sessions/dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CoachDashboardData,
  CoachShooterPerformanceSummary,
  CoachConnection,
  CoachFeedback,
  JwtPayload,
  Session,
  Shot,
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

  /** Coach dashboard aggregate data. */
  @Get('dashboard')
  @Roles('COACH')
  async getDashboard(@CurrentUser() user: JwtPayload): Promise<CoachDashboardData> {
    return this.coachService.getCoachDashboard(user.sub);
  }

  /** Coach lists shooter profiles they created/own. */
  @Get('managed-shooters')
  @Roles('COACH')
  async getManagedShooterProfiles(@CurrentUser() user: JwtPayload): Promise<User[]> {
    return this.coachService.getManagedShooterProfiles(user.sub);
  }

  /** Coach creates a managed shooter profile (without requiring shooter self-registration). */
  @Post('managed-shooters')
  @Roles('COACH')
  async createManagedShooterProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateManagedShooterDto,
  ): Promise<User> {
    return this.coachService.createManagedShooterProfile(user.sub, dto);
  }

  /** Coach edits managed shooter profile details they own. */
  @Patch('managed-shooters/:shooterId')
  @Roles('COACH')
  async updateManagedShooterProfile(
    @CurrentUser() user: JwtPayload,
    @Param('shooterId') shooterId: string,
    @Body() dto: UpdateManagedShooterDto,
  ): Promise<User> {
    return this.coachService.updateManagedShooterProfile(user.sub, shooterId, dto);
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

  /** Coach creates session data for a managed shooter profile. */
  @Post('shooters/:shooterId/sessions')
  @Roles('COACH')
  async createManagedShooterSession(
    @CurrentUser() user: JwtPayload,
    @Param('shooterId') shooterId: string,
    @Body() dto: CreateSessionDto,
  ): Promise<Session> {
    return this.coachService.createManagedShooterSession(user.sub, shooterId, dto);
  }

  /** Coach adds shot records to a managed shooter's session. */
  @Post('shooters/:shooterId/sessions/:sessionId/shots')
  @Roles('COACH')
  async addManagedShooterSessionShots(
    @CurrentUser() user: JwtPayload,
    @Param('shooterId') shooterId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateManagedShotsDto,
  ): Promise<Shot[]> {
    return this.coachService.addManagedShooterSessionShots(user.sub, shooterId, sessionId, dto);
  }

  /** Coach removes a managed shooter's session record. */
  @Delete('shooters/:shooterId/sessions/:sessionId')
  @Roles('COACH')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeManagedShooterSession(
    @CurrentUser() user: JwtPayload,
    @Param('shooterId') shooterId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    return this.coachService.removeManagedShooterSession(user.sub, shooterId, sessionId);
  }

  /** Coach views shooter performance summary. */
  @Get('shooters/:shooterId/performance')
  @Roles('COACH')
  async getShooterPerformanceSummary(
    @CurrentUser() user: JwtPayload,
    @Param('shooterId') shooterId: string,
  ): Promise<CoachShooterPerformanceSummary> {
    return this.coachService.getShooterPerformanceSummary(user.sub, shooterId);
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
