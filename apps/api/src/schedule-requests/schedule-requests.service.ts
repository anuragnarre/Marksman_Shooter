// apps/api/src/schedule-requests/schedule-requests.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { CreateScheduleRequestDto } from './dto/create-request.dto';
import { ResolveRequestDto } from './dto/resolve-request.dto';

const REQUEST_INCLUDE = {
  event: {
    select: {
      id: true,
      title: true,
      start: true,
      end: true,
      eventType: true,
      coachId: true,
    },
  },
  shooter: {
    select: { id: true, name: true, email: true },
  },
  coach: {
    select: { id: true, name: true, email: true },
  },
} as const;

@Injectable()
export class ScheduleRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: EventsGateway,
  ) {}

  /** Shooter creates a schedule change request */
  async createRequest(shooterId: string, dto: CreateScheduleRequestDto) {
    // Verify the event exists and shooter is assigned to it
    const assignee = await this.prisma.eventAssignee.findFirst({
      where: { eventId: dto.eventId, shooterId },
      include: { event: { select: { coachId: true } } },
    });
    if (!assignee) {
      throw new ForbiddenException('You are not assigned to this event');
    }

    // Check no PENDING request already exists for this event+shooter
    const existing = await this.prisma.scheduleRequest.findFirst({
      where: { eventId: dto.eventId, shooterId, status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('A pending request already exists for this event');
    }

    const coachId = assignee.event.coachId;

    const request = await this.prisma.scheduleRequest.create({
      data: {
        eventId:        dto.eventId,
        shooterId,
        coachId,
        suggestedStart: dto.suggestedStart ? new Date(dto.suggestedStart) : null,
        suggestedEnd:   dto.suggestedEnd   ? new Date(dto.suggestedEnd)   : null,
        suggestedTitle: dto.suggestedTitle ?? null,
        notes:          dto.notes ?? null,
      },
      include: REQUEST_INCLUDE,
    });

    // Notify coach via WebSocket
    this.gateway.emitScheduleRequestCreated(coachId, request.id);

    return request;
  }

  /** Coach or shooter gets their requests */
  async getRequests(userId: string, role: string) {
    const where = role === 'COACH'
      ? { coachId: userId }
      : { shooterId: userId };

    return this.prisma.scheduleRequest.findMany({
      where,
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Coach gets pending count (for badge) */
  async getPendingCount(coachId: string): Promise<{ count: number }> {
    const count = await this.prisma.scheduleRequest.count({
      where: { coachId, status: 'PENDING' },
    });
    return { count };
  }

  /** Coach resolves (approves/rejects) a request */
  async resolveRequest(coachId: string, requestId: string, dto: ResolveRequestDto) {
    const request = await this.prisma.scheduleRequest.findFirst({
      where: { id: requestId },
      include: REQUEST_INCLUDE,
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.coachId !== coachId) throw new ForbiddenException('Not your request to resolve');
    if (request.status !== 'PENDING') throw new BadRequestException('Request already resolved');

    // If approved and applyChanges=true, update the event with suggested values
    if (dto.status === 'APPROVED' && dto.applyChanges) {
      const updateData: Record<string, unknown> = {};
      if (request.suggestedStart) updateData.start = request.suggestedStart;
      if (request.suggestedEnd)   updateData.end   = request.suggestedEnd;
      if (request.suggestedTitle) updateData.title = request.suggestedTitle;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.trainingEvent.update({
          where: { id: request.eventId },
          data: updateData,
        });
      }
    }

    const updated = await this.prisma.scheduleRequest.update({
      where: { id: requestId },
      data: {
        status:     dto.status,
        coachNote:  dto.coachNote ?? null,
        resolvedAt: new Date(),
      },
      include: REQUEST_INCLUDE,
    });

    // Notify shooter via WebSocket
    this.gateway.emitScheduleRequestResolved(request.shooterId, requestId, dto.status);

    return updated;
  }

  /** Delete a pending request (shooter cancels) */
  async cancelRequest(shooterId: string, requestId: string) {
    const request = await this.prisma.scheduleRequest.findFirst({
      where: { id: requestId, shooterId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Can only cancel pending requests');

    await this.prisma.scheduleRequest.delete({ where: { id: requestId } });
    return { cancelled: true };
  }
}
