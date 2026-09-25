import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DrillsService {
  constructor(private prisma: PrismaService) {}

  async createDrill(coachId: string, data: any) {
    return this.prisma.drill.create({
      data: {
        ...data,
        coachId,
      },
    });
  }

  async findAllPublic() {
    return this.prisma.drill.findMany({
      where: { isPublic: true },
    });
  }

  async findByCoach(coachId: string) {
    return this.prisma.drill.findMany({
      where: { coachId },
    });
  }
}
