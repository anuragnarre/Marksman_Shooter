import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(data: { name: string; contactEmail?: string; contactPhone?: string }) {
    return this.prisma.organization.create({
      data: data as any,
    });
  }

  async getAllOrganizations() {
    return this.prisma.organization.findMany({
      include: { members: true },
    });
  }

  async getOrganizationById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: { members: true },
    });
  }

  async updateOrganization(id: string, data: { name?: string; contactEmail?: string; contactPhone?: string }) {
    return this.prisma.organization.update({
      where: { id },
      data: data as any,
    });
  }
}
