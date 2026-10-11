import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Pure ballistics math (no external deps needed) */
function computeTrajectory(profile: {
  muzzleVelocityFps: number;
  pelletWeightGrains: number;
  ballisticCoef: number;
  sightHeightInches: number;
  zeroRangeYards: number;
}) {
  const { muzzleVelocityFps, pelletWeightGrains, ballisticCoef, sightHeightInches, zeroRangeYards } = profile;
  const ranges = [0, 10, 25, 50, 75, 100];
  const rows = ranges.map((r) => {
    const t = r / muzzleVelocityFps;
    const drop = 0.5 * 32.174 * t * t * 12; // inches
    const vel = Math.round(muzzleVelocityFps * Math.exp(-ballisticCoef * r * 0.1));
    const ke = (pelletWeightGrains * vel * vel) / 450400;
    return { range: r, drop: +drop.toFixed(2), vel, ke: +ke.toFixed(2) };
  });
  return rows;
}

@Injectable()
export class BallisticsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.ballisticProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculate(userId: string, dto: any) {
    const profile = dto;
    const trajectoryRows = computeTrajectory(profile);
    // Optionally persist the profile
    const saved = await this.prisma.ballisticProfile.upsert({
      where: { id: dto.id ?? 'new' },
      create: { ...profile, userId },
      update: { ...profile },
    }).catch(() =>
      this.prisma.ballisticProfile.create({ data: { ...profile, userId } })
    );
    return { profile: saved, trajectory: trajectoryRows };
  }

  remove(id: string, userId: string) {
    return this.prisma.ballisticProfile.delete({ where: { id } });
  }
}
