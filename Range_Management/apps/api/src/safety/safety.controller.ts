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

  // Quizzes
  @Post('ranges/:rangeId/quizzes')
  @Roles('RANGE_ADMIN')
  createQuiz(@Param('rangeId') rangeId: string, @Body() data: any) {
    return this.safetyService.createQuiz(rangeId, data);
  }

  @Get('ranges/:rangeId/quizzes')
  getQuizzes(@Param('rangeId') rangeId: string) {
    return this.safetyService.getQuizzes(rangeId);
  }

  @Post('quizzes/:quizId/attempts')
  submitQuizAttempt(@Param('quizId') quizId: string, @Body() data: { userId: string, score: number, passed: boolean }) {
    return this.safetyService.submitQuizAttempt(data.userId, quizId, data.score, data.passed);
  }

  // First Aid Kits
  @Get('ranges/:rangeId/first-aid-kits')
  @Roles('RANGE_ADMIN', 'RSO', 'STAFF')
  getFirstAidKits(@Param('rangeId') rangeId: string) {
    return this.safetyService.getFirstAidKits(rangeId);
  }

  @Put('first-aid-kits/:id')
  @Roles('RANGE_ADMIN', 'RSO')
  updateFirstAidKit(@Param('id') id: string, @Body() data: any) {
    return this.safetyService.updateFirstAidKit(id, data);
  }

  // Audit Logs
  @Get('audit-logs')
  @Roles('RANGE_ADMIN')
  getAuditLogs() {
    return this.safetyService.getAuditLogs();
  }
}
