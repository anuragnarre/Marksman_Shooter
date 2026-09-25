import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async createIncidentReport(data: { type: string; severity: any; description: string; reporterId: string; locationId?: string; laneId?: string; status: any }) {
    return this.prisma.incidentReport.create({ data: data as any });
  }

  async getAllIncidents() {
    return this.prisma.incidentReport.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getIncidentById(id: string) {
    return this.prisma.incidentReport.findUnique({
      where: { id },
      include: { IncidentPhoto: true, CorrectiveAction: true },
    });
  }

  async updateIncidentStatus(id: string, status: any) {
    return this.prisma.incidentReport.update({
      where: { id },
      data: { status },
    });
  }

  async uploadIncidentPhoto(incidentId: string, photoUrl: string) {
    // In real app, this takes a file, encrypts it, uploads to S3, and saves URL
    return this.prisma.incidentPhoto.create({
      data: {
        incidentId,
        photoUrl, // encrypted bucket URL
      }
    });
  }

  // Safety Acknowledgment
  async acknowledgeSafety(userId: string, rangeId: string) {
    return this.prisma.safetyAcknowledgment.create({
      data: {
        userId,
        rangeId,
        version: 1,
      }
    });
  }

  async checkSafetyAcknowledgment(userId: string, rangeId: string) {
    return this.prisma.safetyAcknowledgment.findFirst({
      where: { userId, rangeId },
      orderBy: { acknowledgedAt: 'desc' }
    });
  }

  // Quizzes
  async createQuiz(rangeId: string, data: any) {
    return this.prisma.safetyQuiz.create({
      data: { ...data, rangeId }
    });
  }

  async getQuizzes(rangeId: string) {
    return this.prisma.safetyQuiz.findMany({
      where: { rangeId }
    });
  }

  async submitQuizAttempt(userId: string, quizId: string, score: number) {
    const quiz = await this.prisma.safetyQuiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new BadRequestException('Quiz not found');

    const lastAttempt = await this.prisma.quizAttempt.findFirst({
      where: { userId, quizId, passed: false },
      orderBy: { attemptedAt: 'desc' },
    });

    if (lastAttempt) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastAttempt.attemptedAt > oneHourAgo) {
        throw new ForbiddenException('You must wait 1 hour after a failed attempt before trying again.');
      }
    }

    // Pass if score is >= passingScore (e.g., 80)
    const passed = score >= quiz.passingScore;

    return this.prisma.quizAttempt.create({
      data: { userId, quizId, score, passed }
    });
  }

  // First Aid Kits
  async getFirstAidKits(rangeId: string) {
    return this.prisma.firstAidKit.findMany({
      where: { rangeId }
    });
  }

  async updateFirstAidKit(id: string, data: any) {
    return this.prisma.firstAidKit.update({
      where: { id },
      data
    });
  }

  // Audit Logs
  async getAuditLogs(rangeId?: string) {
    // Basic implementation; assuming rangeId can filter logs by some resource prefix, 
    // but AuditLog is generic. We'll just return recent logs for now.
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
  }
}
