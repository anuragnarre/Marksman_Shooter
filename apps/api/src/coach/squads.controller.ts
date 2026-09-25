import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SquadsService } from './squads.service';

@ApiTags('squads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('squads')
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new training squad' })
  createSquad(@Req() req: any, @Body() data: any) {
    return this.squadsService.createSquad(req.user.id, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all squads managed by coach' })
  getMySquads(@Req() req: any) {
    return this.squadsService.getMySquads(req.user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a shooter to a squad' })
  addMember(@Param('id') id: string, @Body('shooterId') shooterId: string) {
    return this.squadsService.addMember(id, shooterId);
  }

  @Post(':id/sessions')
  @ApiOperation({ summary: 'Create a group session for a squad' })
  createGroupSession(@Param('id') id: string, @Req() req: any, @Body() data: any) {
    return this.squadsService.createGroupSession(req.user.id, id, data);
  }
}
