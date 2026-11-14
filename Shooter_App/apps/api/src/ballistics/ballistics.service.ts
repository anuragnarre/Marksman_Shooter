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
  const v0 = Math.max(100, Number(profile.muzzleVelocityFps) || 890);
  const weight = Math.max(1, Number(profile.pelletWeightGrains) || 18.1);
  const bc = Math.max(0.005, Number(profile.ballisticCoef) || 0.033);
  const sightHeight = Math.max(0, Number(profile.sightHeightInches) || 1.8);
  const zeroRange = Math.max(1, Number(profile.zeroRangeYards) || 50);

  const velAt = (r: number) => v0 / (1 + (r * 0.0018) / bc);
  const gravDrop = (r: number) => {
    if (r <= 0) return 0;
    const avgV = (v0 + velAt(r)) / 2;
    const t = (r * 3) / avgV; // seconds for 3*r feet
    return -0.5 * 32.174 * t * t * 12;
  };
  const boreAngle = (sightHeight - gravDrop(zeroRange)) / (zeroRange * 36);

  const ranges = Array.from(new Set([0, 10, 25, 50, 75, 100, zeroRange])).sort((a, b) => a - b);
  return ranges.map((r) => {
    const vel = Math.round(velAt(r));
    const drop = r === 0 ? -sightHeight : -sightHeight + boreAngle * (r * 36) + gravDrop(r);
    const ke = (weight * vel * vel) / 450400;
    return {
      range: r,
      drop: Math.abs(drop) < 0.005 ? 0 : +drop.toFixed(2),
      vel,
      ke: +ke.toFixed(2),
    };
  });
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
