import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DrillsService } from './drills.service';

@ApiTags('drills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drills')
export class DrillsController {
  constructor(private readonly drillsService: DrillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new training drill (Coach only)' })
  createDrill(@Req() req: any, @Body() data: any) {
    return this.drillsService.createDrill(req.user.id, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all drills for the coach' })
  getMyDrills(@Req() req: any) {
    return this.drillsService.findByCoach(req.user.id);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public drills' })
  getPublicDrills() {
    return this.drillsService.findAllPublic();
  }
}
