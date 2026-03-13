// apps/api/src/calendar/calendar.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, RecurringType } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

// Prisma `include` only accepts relation names — scalar fields must NOT be listed here.
// All scalar fields are returned by default when using `include` without `select`.
const EVENT_INCLUDE = {
  assignees: {
    include: {
      shooter: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
    },
  },
} as const;

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Parse a date string safely, falling back to a default ─────────────────
  private safeDate(value: string, fallback: Date): Date {
    // '+' is decoded as space in URL query strings — restore it
    const normalized = value?.replace(' ', '+') ?? '';
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? fallback : d;
  }

  // ── Coach: get all events in date range ───────────────────────────────────
  async getCoachEvents(coachId: string, start: string, end: string) {
    const defaultStart = new Date(Date.now() - 30 * 86400000);
    const defaultEnd   = new Date(Date.now() + 90 * 86400000);
    const events = await this.prisma.trainingEvent.findMany({
      where: {
        coachId,
        deletedAt: null,
        start: { gte: this.safeDate(start, defaultStart) },
        end:   { lte: this.safeDate(end,   defaultEnd) },
      },
      include: EVENT_INCLUDE,
      orderBy: { start: 'asc' },
    });
    return events;
  }

  // ── Shooter: get assigned events in date range ────────────────────────────
  async getShooterEvents(shooterId: string, start: string, end: string) {
    const defaultStart = new Date(Date.now() - 30 * 86400000);
    const defaultEnd   = new Date(Date.now() + 90 * 86400000);
    const assignees = await this.prisma.eventAssignee.findMany({
      where: {
        shooterId,
        event: {
          deletedAt: null,
          start: { gte: this.safeDate(start, defaultStart) },
          end:   { lte: this.safeDate(end,   defaultEnd) },
        },
      },
      include: {
        event: { include: EVENT_INCLUDE },
      },
      orderBy: { event: { start: 'asc' } },
    });
    return assignees.map((a) => ({ ...a.event, assigneeStatus: a.status }));
  }

  // ── Create event (with optional recurrence expansion) ────────────────────
  async createEvent(coachId: string, dto: CreateEventDto) {
    const groupId = dto.recurringType && dto.recurringType !== 'none'
      ? crypto.randomUUID()
      : null;

    const dates = this.expandDates(dto, groupId);

    const created = await this.prisma.$transaction(
      dates.map((d) =>
        this.prisma.trainingEvent.create({
          data: {
            title:           dto.title,
            description:     dto.description ?? null,
            eventType:       dto.eventType ?? 'SESSION',
            start:           d.start,
            end:             d.end,
            allDay:          dto.allDay ?? false,
            color:           dto.color ?? null,
            recurringGroupId: groupId,
            coachId,
            assignees: dto.assigneeIds?.length
              ? {
                  create: dto.assigneeIds.map((sid) => ({
                    shooterId: sid,
                    status: 'PENDING',
                  })),
                }
              : undefined,
          },
          include: EVENT_INCLUDE,
        }),
      ),
    );

    return created;
  }

  // ── Update single event ────────────────────────────────────────────────────
  async updateEvent(coachId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.prisma.trainingEvent.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.coachId !== coachId) throw new ForbiddenException('Not your event');

    // Rebuild assignees if provided
    if (dto.assigneeIds !== undefined) {
      await this.prisma.eventAssignee.deleteMany({ where: { eventId } });
      if (dto.assigneeIds.length > 0) {
        await this.prisma.eventAssignee.createMany({
          data: dto.assigneeIds.map((sid) => ({
            eventId,
            shooterId: sid,
            status: 'PENDING',
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await this.prisma.trainingEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title       !== undefined && { title:       dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.eventType   !== undefined && { eventType:   dto.eventType }),
        ...(dto.start       !== undefined && { start:       new Date(dto.start) }),
        ...(dto.end         !== undefined && { end:         new Date(dto.end) }),
        ...(dto.allDay      !== undefined && { allDay:      dto.allDay }),
        ...(dto.color       !== undefined && { color:       dto.color }),
      },
      include: EVENT_INCLUDE,
    });

    return updated;
  }

  // ── Delete single event ────────────────────────────────────────────────────
  async deleteEvent(coachId: string, eventId: string) {
    const event = await this.prisma.trainingEvent.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.coachId !== coachId) throw new ForbiddenException('Not your event');

    await this.prisma.trainingEvent.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  // ── Delete all events in a recurring group ─────────────────────────────────
  async deleteRecurringGroup(coachId: string, groupId: string) {
    await this.prisma.trainingEvent.updateMany({
      where: { recurringGroupId: groupId, coachId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  // ── Get connected shooters (for assignee picker) ───────────────────────────
  async getConnectedShooters(coachId: string) {
    const connections = await this.prisma.coachConnection.findMany({
      where: { coachId, status: 'APPROVED' },
      include: {
        shooter: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      },
    });
    return connections.map((c) => c.shooter);
  }

  // ── Private: expand dates for recurring events ────────────────────────────
  private expandDates(dto: CreateEventDto, groupId: string | null) {
    const start = new Date(dto.start);
    const end   = new Date(dto.end);
    const durationMs = end.getTime() - start.getTime();

    if (!groupId || !dto.recurringType || dto.recurringType === 'none') {
      return [{ start, end }];
    }

    const until = dto.recurringUntil ? new Date(dto.recurringUntil) : (() => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + 3);
      return d;
    })();

    const stepMs: Record<RecurringType, number> = {
      none:      0,
      daily:     86400000,
      weekly:    7 * 86400000,
      biweekly:  14 * 86400000,
      monthly:   0, // handled specially
    };

    const dates: { start: Date; end: Date }[] = [];
    let current = new Date(start);

    while (current <= until && dates.length < 52) {
      dates.push({ start: new Date(current), end: new Date(current.getTime() + durationMs) });

      if (dto.recurringType === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else {
        current = new Date(current.getTime() + stepMs[dto.recurringType]);
      }
    }

    return dates;
  }
}
