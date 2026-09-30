import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.equipment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: any) {
    return this.prisma.equipment.create({
      data: { ...dto, userId },
    });
  }

  update(id: string, userId: string, dto: any) {
    return this.prisma.equipment.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string, userId: string) {
    return this.prisma.equipment.delete({ where: { id } });
  }
}
