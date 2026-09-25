import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMembershipTier(data: { name: string; description?: string; monthlyPrice: number; maxActiveBookings: number; priorityBookingDays: number }) {
    return this.prisma.membershipTier.create({ data: data as any });
  }

  async getAllTiers() {
    return this.prisma.membershipTier.findMany();
  }

  async createSubscription(data: { userId: string; tierId: string; status: any; startDate: Date; endDate?: Date; organizationId?: string }) {
    return this.prisma.membershipSubscription.create({ data: data as any });
  }

  async getUserSubscription(userId: string) {
    return this.prisma.membershipSubscription.findFirst({
      where: { userId },
      include: { tier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllSubscriptions() {
    return this.prisma.membershipSubscription.findMany({
      include: {
        tier: true,
        user: {
          select: {
            id: true,
            name: true,
            shooterProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllOrganizations() {
    return this.prisma.organization.findMany({
      include: {
        _count: {
          select: { members: true }
        },
        admin: {
          select: { name: true }
        }
      }
    });
  }
}

