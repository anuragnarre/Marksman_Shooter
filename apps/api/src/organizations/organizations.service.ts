import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(adminUserId: string, data: { name: string; type: string; description?: string }) {
    return this.prisma.organization.create({
      data: {
        ...data,
        adminUserId
      },
    });
  }

  async getOrganizationsByUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { adminUserId: userId },
      include: { members: true, ranges: true },
    });
  }

  async getOrganizationById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: { members: true, ranges: true },
    });
  }

  async updateOrganization(id: string, data: { name?: string; description?: string }) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async registerRange(organizationId: string, ownerId: string, data: any) {
    // Also set the ownerId to the adminUserId (as ShootingRange requires ownerId currently)
    return this.prisma.shootingRange.create({
      data: {
        ...data,
        organizationId,
        ownerId,
        // generate a random 6 char code if not provided
        code: data.code || Math.random().toString(36).substring(2, 8).toUpperCase()
      }
    });
  }
}
