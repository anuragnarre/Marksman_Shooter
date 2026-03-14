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

  private isSelfManagedEvent(
    event: { coachId: string; assignees: { shooterId: string }[] },
    userId: string,
  ) {
    return (
      event.coachId === userId &&
      event.assignees.length === 1 &&
      event.assignees[0]?.shooterId === userId
    );
  }

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
  async createEvent(actorId: string, actorRole: string, dto: CreateEventDto) {
    const isCoach = actorRole === 'COACH';
    const assigneeIds = isCoach ? dto.assigneeIds ?? [] : [actorId];

    if (!isCoach && dto.assigneeIds !== undefined) {
      const validSelfOnly = dto.assigneeIds.length === 1 && dto.assigneeIds[0] === actorId;
      if (!validSelfOnly) {
        throw new ForbiddenException('Shooters can only assign calendar items to themselves');
      }
    }
    if (isCoach) {
      await this.assertCoachCanAssignShooters(actorId, assigneeIds);
    }

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
            coachId:         actorId,
            assignees: assigneeIds.length
              ? {
                  create: assigneeIds.map((sid) => ({
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
  async updateEvent(actorId: string, actorRole: string, eventId: string, dto: UpdateEventDto) {
    const isCoach = actorRole === 'COACH';
    const event = await this.prisma.trainingEvent.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { assignees: { select: { shooterId: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.coachId !== actorId) throw new ForbiddenException('Not your event');

    if (!isCoach && !this.isSelfManagedEvent(event, actorId)) {
      throw new ForbiddenException('You can only edit your own training items');
    }

    if (!isCoach && dto.assigneeIds !== undefined) {
      throw new ForbiddenException('Shooters cannot reassign calendar items');
    }

    // Rebuild assignees if provided
    if (isCoach && dto.assigneeIds !== undefined) {
      await this.assertCoachCanAssignShooters(actorId, dto.assigneeIds);
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
  async deleteEvent(actorId: string, actorRole: string, eventId: string) {
    const isCoach = actorRole === 'COACH';
    const event = await this.prisma.trainingEvent.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { assignees: { select: { shooterId: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.coachId !== actorId) throw new ForbiddenException('Not your event');
    if (!isCoach && !this.isSelfManagedEvent(event, actorId)) {
      throw new ForbiddenException('You can only delete your own training items');
    }

    await this.prisma.trainingEvent.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  // ── Delete all events in a recurring group ─────────────────────────────────
  async deleteRecurringGroup(actorId: string, actorRole: string, groupId: string) {
    const isCoach = actorRole === 'COACH';
    const events = await this.prisma.trainingEvent.findMany({
      where: { recurringGroupId: groupId, coachId: actorId, deletedAt: null },
      select: { id: true, coachId: true, assignees: { select: { shooterId: true } } },
    });

    if (!isCoach && events.some((event) => !this.isSelfManagedEvent(event, actorId))) {
      throw new ForbiddenException('You can only delete recurring items you created for yourself');
    }

    if (events.length === 0) return { deleted: true };

    await this.prisma.trainingEvent.updateMany({
      where: { id: { in: events.map((event) => event.id) } },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  // ── Get connected shooters (for assignee picker) ───────────────────────────
  async getConnectedShooters(coachId: string) {
    const [connections, managedProfiles] = await Promise.all([
      this.prisma.coachConnection.findMany({
        where: { coachId, status: 'APPROVED' },
        include: {
          shooter: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        },
      }),
      this.prisma.shooterProfile.findMany({
        where: { managedByCoachId: coachId, isManaged: true },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        },
      }),
    ]);

    const byId = new Map<string, { id: string; name: string; email: string; role: string; createdAt: Date }>();
    for (const c of connections) byId.set(c.shooter.id, c.shooter);
    for (const profile of managedProfiles) byId.set(profile.user.id, profile.user);
    return Array.from(byId.values());
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

  private async assertCoachCanAssignShooters(coachId: string, shooterIds: string[]): Promise<void> {
    if (shooterIds.length === 0) return;

    const uniqueShooterIds = Array.from(new Set(shooterIds));
    const [connections, managedProfiles] = await Promise.all([
      this.prisma.coachConnection.findMany({
        where: { coachId, status: 'APPROVED', shooterId: { in: uniqueShooterIds } },
        select: { shooterId: true },
      }),
      this.prisma.shooterProfile.findMany({
        where: { managedByCoachId: coachId, isManaged: true, userId: { in: uniqueShooterIds } },
        select: { userId: true },
      }),
    ]);

    const allowedIds = new Set<string>([
      ...connections.map((c) => c.shooterId),
      ...managedProfiles.map((p) => p.userId),
    ]);

    const forbiddenShooterId = uniqueShooterIds.find((id) => !allowedIds.has(id));
    if (forbiddenShooterId) {
      throw new ForbiddenException('You can only assign events to your connected or managed shooters');
    }
  }
}
