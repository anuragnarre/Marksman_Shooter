import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RegisterEventDto } from './dto/register-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublished() {
    return this.prisma.competitionEvent.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        categories: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOnePublished(id: string) {
    const event = await this.prisma.competitionEvent.findUnique({
      where: { id },
      include: {
        categories: true,
        registrations: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async getUpcomingPublished() {
    return this.prisma.competitionEvent.findMany({
      where: {
        status: 'PUBLISHED',
        date: { gte: new Date() },
      },
      include: {
        categories: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });
  }

  async create(dto: CreateEventDto, adminUserId: string) {
    const { categories, ...eventData } = dto;

    return this.prisma.competitionEvent.create({
      data: {
        ...eventData,
        date: new Date(dto.date),
        images: dto.images ?? [],
        videos: dto.videos ?? [],
        createdById: adminUserId,
        categories: categories?.length
          ? { create: categories }
          : undefined,
      },
      include: { categories: true },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.prisma.competitionEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.competitionEvent.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { categories: true, _count: { select: { registrations: true } } },
    });
  }

  async delete(id: string) {
    const event = await this.prisma.competitionEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    await this.prisma.competitionEvent.delete({ where: { id } });
    return { deleted: true };
  }

  async register(eventId: string, userId: string, dto: RegisterEventDto) {
    const event = await this.prisma.competitionEvent.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('Event is not open for registration');
    }

    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      throw new BadRequestException('Event is full');
    }

    const existing = await this.prisma.competitionEventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) throw new ConflictException('Already registered for this event');

    return this.prisma.competitionEventRegistration.create({
      data: {
        eventId,
        userId,
        categoryId: dto.categoryId ?? null,
        paymentStatus: 'COMING_SOON',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
      },
    });
  }

  async getRegistrations(eventId: string) {
    const event = await this.prisma.competitionEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.competitionEventRegistration.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.competitionEvent.findMany({
      include: {
        categories: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}
