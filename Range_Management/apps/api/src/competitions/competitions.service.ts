import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompetitionsService {
  constructor(private prisma: PrismaService) {}

  async getRankings(discipline: string) {
    const filterDiscipline = discipline || '10m Olympic';
    
    // Fetch top Personal Bests for this discipline
    const pbs = await this.prisma.personalBest.findMany({
      where: { discipline: filterDiscipline },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { score: 'desc' },
      take: 50
    });

    if (pbs.length === 0) {
      // Fallback response for empty databases so the UI doesn't look broken during development
      return [
        { rank: '#1', name: 'E. Varga', score: '632.4', xCount: '58x', avgVel: '592 fps', isTop: true },
        { rank: '#2', name: 'S. Lindholm', score: '631.8', xCount: '55x', avgVel: '590 fps', isTop: false },
        { rank: '#3', name: 'J. Doe', score: '629.1', xCount: '51x', avgVel: '595 fps', isTop: false },
      ];
    }

    return pbs.map((pb, index) => {
      // We estimate xCount and avgVel if not explicitly stored in PB model
      const xCount = Math.floor(pb.score / 10.9) + 'x'; 
      return {
        rank: `#${index + 1}`,
        name: pb.user?.name || 'Unknown Shooter',
        score: pb.score.toFixed(1),
        xCount,
        avgVel: 'N/A', // Muzzle velocity isn't easily derivable without the session's ballistic profile
        isTop: index === 0
      };
    });
  }

  async getActiveChallenge() {
    return {
      title: "Micro-Grouping Directive",
      description: "Achieve the smallest 5-shot group at 50 yards. Submit your electronic target data to qualify.",
      target: "50y",
      shots: 5,
      currentBest: "0.18\"",
      currentLeader: "E. Varga"
    };
  }
}
