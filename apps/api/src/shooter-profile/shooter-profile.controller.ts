import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShooterProfileService } from './shooter-profile.service';

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

  @Put()
  @ApiOperation({ summary: 'Update shooter profile' })
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    return this.shooterProfileService.updateProfile(req.user.id, updateData);
  }
}
