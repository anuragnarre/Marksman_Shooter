import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShooterProfileService {
  private readonly logger = new Logger(ShooterProfileService.name);

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

  async getAllProfiles() {
    return this.prisma.shooterProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
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

  async getCertifications(userId: string) {
    return this.prisma.certification.findMany({
      where: { userId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getCompletenessScore(userId: string) {
    const profile = await this.prisma.shooterProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const fieldsToCheck = [
      profile.dateOfBirth, profile.gender, profile.dominantHand,
      profile.eyeDominance, profile.stance, profile.nationality,
      profile.profilePhotoUrl, profile.heightCm, profile.weightKg,
      profile.wingspanCm, profile.phone, profile.emergencyContactName,
      profile.primaryWeapon
    ];

    const filledFields = fieldsToCheck.filter(f => f !== null && f !== undefined && f !== '');
    const score = Math.round((filledFields.length / fieldsToCheck.length) * 100);

    return { score, totalFields: fieldsToCheck.length, filledFields: filledFields.length };
  }

  async getCompetitionEligibility(userId: string) {
    const profile = await this.prisma.shooterProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const licenses = await this.prisma.license.findMany({
      where: { userId, status: 'VALID', expiryDate: { gte: new Date() } }
    });

    const isEligible = licenses.length > 0 && profile.backgroundCheckStatus === 'CLEARED' && !!profile.dateOfBirth;
    
    return {
      isEligible,
      reasons: {
        hasValidLicense: licenses.length > 0,
        backgroundCleared: profile.backgroundCheckStatus === 'CLEARED',
        hasDateOfBirth: !!profile.dateOfBirth,
      },
      ageCategory: this.calculateAgeCategory(profile.dateOfBirth)
    };
  }

  private calculateAgeCategory(dob: Date | null): string {
    if (!dob) return 'UNKNOWN';
    const ageDifMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    
    if (age < 14) return 'U14';
    if (age < 17) return 'U17';
    if (age < 21) return 'U21';
    if (age < 45) return 'Senior';
    return 'Master';
  }

  async getRankings(userId: string) {
    return this.prisma.rangeRanking.findMany({
      where: { shooterId: userId },
      orderBy: { eloScore: 'desc' },
      include: { rankHistories: { orderBy: { createdAt: 'desc' }, take: 5 } }
    });
  }

  async getMedicalNotes(userId: string, userRole: string) {
    return this.prisma.medicalNote.findUnique({
      where: { userId }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkLicenseExpiries() {
    this.logger.log('Running daily license expiry check...');
  }
}
