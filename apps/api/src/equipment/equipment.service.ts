import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.equipment.findMany({
      where: { userId },
      include: {
        optic: true,
        serviceLogs: true,
        ballisticProfiles: true
      },
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

  async addServiceLog(equipmentId: string, data: any) {
    return this.prisma.equipmentServiceLog.create({
      data: { ...data, equipmentId }
    });
  }

  async addAmmoLot(userId: string, data: any) {
    return this.prisma.ammoLot.create({
      data: {
        ...data,
        userId,
        inventory: {
          create: { totalRounds: data.qty }
        }
      },
      include: { inventory: true }
    });
  }

  async getAmmoLots(userId: string) {
    return this.prisma.ammoLot.findMany({
      where: { userId },
      include: { inventory: true, reloadingLogs: true }
    });
  }

  async addReloadingLog(ammoLotId: string, data: any) {
    const log = await this.prisma.reloadingLog.create({
      data: { ...data, ammoLotId }
    });
    
    // Update inventory
    await this.prisma.ammoInventory.update({
      where: { ammoLotId },
      data: {
        totalRounds: { increment: data.roundsProduced }
      }
    });

    return log;
  }

  async createBallisticProfile(equipmentId: string, data: any) {
    return this.prisma.ballisticProfile.create({
      data: { ...data, equipmentId }
    });
  }
}

