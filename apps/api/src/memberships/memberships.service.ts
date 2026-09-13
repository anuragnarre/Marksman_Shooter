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
}
