import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('safety')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('incidents')
  @Roles('RANGE_ADMIN', 'RSO')
  createIncident(@Body() createIncidentDto: { type: string; severity: any; description: string; reporterId: string; locationId?: string; laneId?: string; status: any }) {
    return this.safetyService.createIncidentReport(createIncidentDto);
  }

  @Get('incidents')
  @Roles('RANGE_ADMIN', 'RSO')
  findAllIncidents() {
    return this.safetyService.getAllIncidents();
  }

  @Get('incidents/:id')
  @Roles('RANGE_ADMIN', 'RSO')
  findOneIncident(@Param('id') id: string) {
    return this.safetyService.getIncidentById(id);
  }

  @Put('incidents/:id/status')
  @Roles('RANGE_ADMIN')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.safetyService.updateIncidentStatus(id, status);
  }
}
