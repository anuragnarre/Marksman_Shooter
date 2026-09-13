import { Injectable } from '@nestjs/common';
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
}
