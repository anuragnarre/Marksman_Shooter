import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RangesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.rangeLocation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: any) {
    return this.prisma.rangeLocation.create({
      data: { ...dto, userId },
    });
  }

  update(id: string, userId: string, dto: any) {
    return this.prisma.rangeLocation.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string, userId: string) {
    return this.prisma.rangeLocation.delete({ where: { id } });
  }
}
