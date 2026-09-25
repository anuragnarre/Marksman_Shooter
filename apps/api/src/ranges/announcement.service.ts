import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAnnouncement(rangeId: string, createdById: string, dto: CreateAnnouncementDto) {
    return this.prisma.rangeAnnouncement.create({
      data: {
        rangeId,
        createdById,
        title: dto.title,
        body: dto.body,
        type: dto.type ?? 'GENERAL',
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: true,
      },
    });
  }

  async getActiveAnnouncements(rangeId: string) {
    const now = new Date();
    return this.prisma.rangeAnnouncement.findMany({
      where: {
        rangeId,
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateAnnouncement(announcementId: string, rangeId: string) {
    const ann = await this.prisma.rangeAnnouncement.findFirst({
      where: { id: announcementId, rangeId },
    });
    if (!ann) throw new NotFoundException('Announcement not found');
    return this.prisma.rangeAnnouncement.update({
      where: { id: announcementId },
      data: { isActive: false },
    });
  }

  /** Nightly cron: auto-deactivate expired announcements */
  @Cron('0 3 * * *')
  async deactivateExpired() {
    const result = await this.prisma.rangeAnnouncement.updateMany({
      where: { isActive: true, endsAt: { lt: new Date() } },
      data: { isActive: false },
    });
    this.logger.log(`Deactivated ${result.count} expired announcements`);
  }
}
