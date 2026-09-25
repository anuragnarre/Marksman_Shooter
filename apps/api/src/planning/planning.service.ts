import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService) {}

  async getDrills() {
    // Return mock drills for now if DB is empty, or fetch from DB
    const count = await this.prisma.drill.count();
    if (count === 0) {
      await this.prisma.drill.createMany({
        data: [
          {
            coachId: 'system',
            name: 'The Dot Drill',
            description: 'Engage 5 small targets at varying distances. Tests foundational trigger control and sight alignment under mild time pressure.',
            category: 'TRIGGER',
            discipline: 'All',
            timeLimit: 300,
            rounds: 10,
            distance: '25-50Y',
            difficultyLevel: 'INTERMEDIATE',
            isPublic: true,
            tags: ['Precision']
          },
          {
            coachId: 'system',
            name: 'Rapid Engagement',
            description: 'Multiple targets spread laterally. Focuses on smooth target acquisition and minimizing over-travel during transitions.',
            category: 'POSITIONING',
            discipline: 'All',
            timeLimit: 150,
            rounds: 15,
            distance: '20Y',
            difficultyLevel: 'ADVANCED',
            isPublic: true,
            tags: ['Speed / Transition']
          },
          {
            coachId: 'system',
            name: 'Trigger Reset Drill',
            description: 'Slow-fire, single shot at a time with deliberate trigger reset. Eliminates flinch and builds clean follow-through habits.',
            category: 'TRIGGER',
            discipline: 'All',
            timeLimit: 600,
            rounds: 20,
            distance: '10-25Y',
            difficultyLevel: 'BEGINNER',
            isPublic: true,
            tags: ['Fundamentals']
          },
          {
            coachId: 'system',
            name: '60-Round Endurance',
            description: 'Full competitive simulation. Six 10-round strings with 90-second intervals. Records split times and group sizes per string.',
            category: 'BREATHING',
            discipline: 'All',
            timeLimit: 2700,
            rounds: 60,
            distance: '50Y',
            difficultyLevel: 'ELITE',
            isPublic: true,
            tags: ['Endurance']
          }
        ]
      });
    }

    return this.prisma.drill.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async saveSessionPlan(userId: string, data: any) {
    const { primaryFocus, objectives, shooterId } = data;
    const targetUserId = shooterId || userId;

    const content = {
      primaryFocus,
      objectives
    };

    return this.prisma.trainingPlan.create({
      data: {
        userId: targetUserId,
        content: content,
        weekStart: new Date(),
        focusAreas: [primaryFocus]
      }
    });
  }

  async getSessionPlan(shooterId: string) {
    return this.prisma.trainingPlan.findFirst({
      where: { userId: shooterId },
      orderBy: { generatedAt: 'desc' }
    });
  }
}
