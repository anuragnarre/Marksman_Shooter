import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SquadsService {
  constructor(private prisma: PrismaService) {}

  async createSquad(coachId: string, data: any) {
    return this.prisma.squad.create({
      data: {
        ...data,
        coachId,
      },
    });
  }

  async getMySquads(coachId: string) {
    return this.prisma.squad.findMany({
      where: { coachId },
      include: {
        members: {
          include: {
            shooter: { select: { id: true, name: true } }
          }
        }
      }
    });
  }

  async addMember(squadId: string, shooterId: string) {
    return this.prisma.squadMember.create({
      data: {
        squadId,
        shooterId,
      }
    });
  }

  async createGroupSession(coachId: string, squadId: string, data: any) {
    return this.prisma.groupSession.create({
      data: {
        ...data,
        coachId,
        squadId,
      }
    });
  }
}
