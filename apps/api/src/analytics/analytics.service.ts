// apps/api/src/analytics/analytics.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsResult,
  WeaponPerformance,
  OverviewAnalytics,
  SessionTrendPoint,
  RingDistributionBucket,
} from '@shooting-platform/shared-types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForSession(sessionId: string): Promise<AnalyticsResult> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: { shots: { orderBy: { shotNumber: 'asc' } } },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const shots = session.shots;
    if (shots.length === 0) {
      return {
        sessionId,
        totalShots: 0,
        averageScore: 0,
        mpi: { x: 0, y: 0 },
        groupRadius: 0,
        stdDev: 0,
        seriesAverages: [],
        minScore: 0,
        maxScore: 0,
      };
    }

    const scores = shots.map((s) => s.score);
    const xs = shots.map((s) => s.x);
    const ys = shots.map((s) => s.y);

    // Average Score: sum of all shot scores / total shot count
    const averageScore =
      scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Mean Point of Impact (MPI): centroid of all shot coordinates
    // This is the arithmetic mean of x and y coordinates across all shots
    const mpi = {
      x: xs.reduce((sum, x) => sum + x, 0) / xs.length,
      y: ys.reduce((sum, y) => sum + y, 0) / ys.length,
    };

    // Group Radius: max Euclidean distance between any two shots (O(n²) pairs)
    // Measures the total spread of the shot group on the target
    let groupRadius = 0;
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const dx = shots[i].x - shots[j].x;
        const dy = shots[i].y - shots[j].y;
        // sqrt((x1-x2)² + (y1-y2)²)
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > groupRadius) groupRadius = dist;
      }
    }

    // Standard Deviation of scores: sqrt(avg((score - avgScore)²))
    // Measures how consistent the shooter's scores are across shots
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    // Series Analysis: split shots into groups of 10, compute avg per group
    // Reveals endurance-related score drift across a long session
    const seriesAverages = chunk(shots, 10).map((group) => {
      const groupScores = group.map((s) => s.score);
      return groupScores.reduce((sum, s) => sum + s, 0) / groupScores.length;
    });

    return {
      sessionId,
      totalShots: shots.length,
      averageScore: round(averageScore),
      mpi: { x: round(mpi.x), y: round(mpi.y) },
      groupRadius: round(groupRadius),
      stdDev: round(stdDev),
      seriesAverages: seriesAverages.map(round),
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
    };
  }
  async computeWeaponSummary(shooterId: string): Promise<WeaponPerformance[]> {
    const sessions = await this.prisma.session.findMany({
      where: { shooterId, deletedAt: null },
      include: { shots: true },
    });

    const byWeapon = new Map<string, { scores: number[]; shots: number; groupRadii: number[] }>();

    for (const session of sessions) {
      const key = session.weaponType;
      if (!byWeapon.has(key)) {
        byWeapon.set(key, { scores: [], shots: 0, groupRadii: [] });
      }
      const entry = byWeapon.get(key)!;
      for (const shot of session.shots) {
        entry.scores.push(shot.score);
      }
      entry.shots += session.shots.length;

      // Compute group radius for this session
      if (session.shots.length > 1) {
        let gr = 0;
        for (let i = 0; i < session.shots.length; i++) {
          for (let j = i + 1; j < session.shots.length; j++) {
            const dx = session.shots[i].x - session.shots[j].x;
            const dy = session.shots[i].y - session.shots[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > gr) gr = d;
          }
        }
        entry.groupRadii.push(round(gr));
      }
    }

    const result: WeaponPerformance[] = [];
    for (const [weaponType, data] of byWeapon.entries()) {
      const sessionCount = sessions.filter((s) => s.weaponType === weaponType).length;
      const avgScore = data.scores.length
        ? round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0;
      const bestScore = data.scores.length ? Math.max(...data.scores) : 0;
      const avgGroupRadius = data.groupRadii.length
        ? round(data.groupRadii.reduce((a, b) => a + b, 0) / data.groupRadii.length)
        : 0;
      result.push({ weaponType, sessions: sessionCount, averageScore: avgScore, bestScore, totalShots: data.shots, groupRadius: avgGroupRadius });
    }

    return result.sort((a, b) => b.sessions - a.sessions);
  }

  async computeOverview(shooterId: string): Promise<OverviewAnalytics> {
    const sessions = await this.prisma.session.findMany({
      where: { shooterId, deletedAt: null },
      include: { shots: { orderBy: { shotNumber: 'asc' } } },
      orderBy: { sessionDate: 'asc' },
    });

    if (sessions.length === 0) {
      return {
        totalSessions: 0, totalShots: 0, overallAverage: 0,
        bestScore: 0, bestSessionAvg: 0, consistency: 0,
        sessionTrend: [], ringDistribution: [], topDiscipline: '—',
      };
    }

    const allShots = sessions.flatMap((s) => s.shots);
    const allScores = allShots.map((s) => s.score);

    // Session trend points
    const sessionTrend: SessionTrendPoint[] = sessions
      .filter((s) => s.shots.length > 0)
      .map((s) => {
        const scores = s.shots.map((sh) => sh.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, sc) => sum + Math.pow(sc - avgScore, 2), 0) / scores.length;
        let gr = 0;
        for (let i = 0; i < s.shots.length; i++) {
          for (let j = i + 1; j < s.shots.length; j++) {
            const d = Math.sqrt(Math.pow(s.shots[i].x - s.shots[j].x, 2) + Math.pow(s.shots[i].y - s.shots[j].y, 2));
            if (d > gr) gr = d;
          }
        }
        return {
          sessionId: s.id,
          date: s.sessionDate.toISOString().slice(0, 10),
          discipline: s.discipline,
          weaponType: s.weaponType,
          avgScore: round(avgScore),
          totalShots: s.shots.length,
          groupRadius: round(gr),
          stdDev: round(Math.sqrt(variance)),
          xRingCount: scores.filter((sc) => sc >= 10.5).length,
        };
      });

    // Ring distribution across all shots
    const ringBuckets = [
      { ring: '≤7',   min: 0,    max: 7.99,  color: '#FF4D6D' },
      { ring: '8',    min: 8,    max: 8.99,  color: '#FF4D6D' },
      { ring: '9',    min: 9,    max: 9.99,  color: '#00E5A0' },
      { ring: '10',   min: 10,   max: 10.49, color: '#4FC3F7' },
      { ring: '10.X', min: 10.5, max: 10.9,  color: '#F5A623' },
    ];
    const ringDistribution: RingDistributionBucket[] = ringBuckets.map((b) => {
      const count = allScores.filter((s) => s >= b.min && s <= b.max).length;
      return { ring: b.ring, count, pct: allScores.length ? round(count / allScores.length * 100, 1) : 0, color: b.color };
    });

    // Top discipline by sessions
    const disciplineCount = new Map<string, number>();
    sessions.forEach((s) => disciplineCount.set(s.discipline, (disciplineCount.get(s.discipline) ?? 0) + 1));
    const topDiscipline = [...disciplineCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    const avgScores = sessionTrend.map((s) => s.avgScore);
    const stdDevs = sessionTrend.map((s) => s.stdDev);
    const overallAvg = allScores.length ? round(allScores.reduce((a, b) => a + b) / allScores.length) : 0;
    const avgStdDev = stdDevs.length ? stdDevs.reduce((a, b) => a + b) / stdDevs.length : 0;

    return {
      totalSessions: sessions.length,
      totalShots: allShots.length,
      overallAverage: overallAvg,
      bestScore: allScores.length ? Math.max(...allScores) : 0,
      bestSessionAvg: avgScores.length ? round(Math.max(...avgScores)) : 0,
      consistency: avgStdDev > 0 ? round(Math.max(0, 10 - avgStdDev * 5), 1) : 10,
      sessionTrend,
      ringDistribution,
      topDiscipline,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function round(n: number, decimals = 4): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
