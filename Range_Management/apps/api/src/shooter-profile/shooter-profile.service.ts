import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShooterProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.shooterProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Shooter profile not found');
    }

    return profile;
  }

  async getPersonalBests(userId: string) {
    const profile = await this.getProfile(userId);
    return this.prisma.personalBest.findMany({
      where: { shooterId: profile.id },
      orderBy: { achievedAt: 'desc' },
    });
  }

  async getLicenses(userId: string) {
    return this.prisma.license.findMany({
      where: { userId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.shooterProfile.update({
      where: { userId },
      data,
    });
  }
}
