import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShooterProfileService } from './shooter-profile.service';
import { UpdateShooterProfileDto } from './dto/update-shooter-profile.dto';

@ApiTags('Shooter Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shooter-profile')
export class ShooterProfileController {
  constructor(private readonly shooterProfileService: ShooterProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user shooter profile' })
  async getProfile(@Req() req: any) {
    return this.shooterProfileService.getProfile(req.user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all shooter profiles' })
  async getAllProfiles() {
    return this.shooterProfileService.getAllProfiles();
  }

  @Get('personal-bests')
  @ApiOperation({ summary: 'Get personal bests for current user' })
  async getPersonalBests(@Req() req: any) {
    return this.shooterProfileService.getPersonalBests(req.user.id);
  }

  @Get('licenses')
  @ApiOperation({ summary: 'Get licenses for current user' })
  async getLicenses(@Req() req: any) {
    return this.shooterProfileService.getLicenses(req.user.id);
  }

  @Get('certifications')
  @ApiOperation({ summary: 'Get certifications for current user' })
  async getCertifications(@Req() req: any) {
    return this.shooterProfileService.getCertifications(req.user.id);
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get range rankings for current user' })
  async getRankings(@Req() req: any) {
    return this.shooterProfileService.getRankings(req.user.id);
  }

  @Get('medical-notes')
  @ApiOperation({ summary: 'Get medical notes for current user' })
  async getMedicalNotes(@Req() req: any) {
    return this.shooterProfileService.getMedicalNotes(req.user.id, req.user.role);
  }

  @Get('completeness')
  @ApiOperation({ summary: 'Get profile completeness score' })
  async getCompletenessScore(@Req() req: any) {
    return this.shooterProfileService.getCompletenessScore(req.user.id);
  }

  @Get('competition-eligibility')
  @ApiOperation({ summary: 'Get competition eligibility for current user' })
  async getCompetitionEligibility(@Req() req: any) {
    return this.shooterProfileService.getCompetitionEligibility(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update shooter profile' })
  async updateProfile(@Req() req: any, @Body() updateData: UpdateShooterProfileDto) {
    return this.shooterProfileService.updateProfile(req.user.id, updateData);
  }
}
