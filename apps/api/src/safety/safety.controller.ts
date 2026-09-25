import { Controller, Get, Post, Body, Param, Put, Patch, Query } from '@nestjs/common';
import { SafetyService } from './safety.service';

@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('incidents')
  createIncidentReport(@Body() data: any) {
    return this.safetyService.createIncidentReport(data);
  }

  @Get('incidents')
  getAllIncidents() {
    return this.safetyService.getAllIncidents();
  }

  @Get('incidents/:id')
  getIncidentById(@Param('id') id: string) {
    return this.safetyService.getIncidentById(id);
  }

  @Patch('incidents/:id/status')
  updateIncidentStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.safetyService.updateIncidentStatus(id, status);
  }

  @Post('incidents/:id/photo')
  uploadIncidentPhoto(@Param('id') id: string, @Body('photoUrl') photoUrl: string) {
    return this.safetyService.uploadIncidentPhoto(id, photoUrl);
  }

  @Post('acknowledgment')
  acknowledgeSafety(@Body('userId') userId: string, @Body('rangeId') rangeId: string) {
    return this.safetyService.acknowledgeSafety(userId, rangeId);
  }

  @Get('acknowledgment')
  checkSafetyAcknowledgment(@Query('userId') userId: string, @Query('rangeId') rangeId: string) {
    return this.safetyService.checkSafetyAcknowledgment(userId, rangeId);
  }

  @Post('quizzes')
  createQuiz(@Body('rangeId') rangeId: string, @Body() data: any) {
    return this.safetyService.createQuiz(rangeId, data);
  }

  @Get('quizzes')
  getQuizzes(@Query('rangeId') rangeId: string) {
    return this.safetyService.getQuizzes(rangeId);
  }

  @Post('quizzes/attempt')
  submitQuizAttempt(@Body('userId') userId: string, @Body('quizId') quizId: string, @Body('score') score: number) {
    return this.safetyService.submitQuizAttempt(userId, quizId, score);
  }

  @Get('first-aid')
  getFirstAidKits(@Query('rangeId') rangeId: string) {
    return this.safetyService.getFirstAidKits(rangeId);
  }

  @Patch('first-aid/:id')
  updateFirstAidKit(@Param('id') id: string, @Body() data: any) {
    return this.safetyService.updateFirstAidKit(id, data);
  }

  @Get('audit-logs')
  getAuditLogs(@Query('rangeId') rangeId?: string) {
    return this.safetyService.getAuditLogs(rangeId);
  }
}
