import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, isBefore } from 'date-fns';

@Injectable()
export class RangeOperationsService {
  private readonly logger = new Logger(RangeOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkWaitlistCapacity() {
    this.logger.debug('Running waitlist turnover check...');

    const availableSlots = await this.prisma.timeSlot.findMany({
      where: {
        status: 'AVAILABLE',
        startTime: {
          lte: addDays(new Date(), 1)
        }
      },
      include: {
        lane: true
      }
    });

    for (const slot of availableSlots) {
      const nextInLine = await this.prisma.waitlist.findFirst({
        where: {
          slotId: slot.id,
          notifiedAt: null
        },
        orderBy: {
          position: 'asc'
        }
      });

      if (nextInLine) {
        this.logger.log(`Notifying User ${nextInLine.userId} for slot ${slot.id} in Lane ${slot.lane?.laneNumber || 'Any'}`);
        await this.prisma.waitlist.update({
          where: { id: nextInLine.id },
          data: { notifiedAt: new Date() }
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateRecurringMaintenance() {
    this.logger.debug('Running recurring maintenance generation...');

    const today = new Date();
    const tasks = await this.prisma.maintenanceTask.findMany({
      where: {
        status: 'COMPLETED',
        frequency: {
          not: 'ONCE'
        }
      }
    });

    for (const task of tasks) {
      if (isBefore(task.nextDueDate, today)) {
        let nextDate = new Date(task.nextDueDate);
        if (task.frequency === 'DAILY') {
          nextDate = addDays(nextDate, 1);
        } else if (task.frequency === 'WEEKLY') {
          nextDate = addDays(nextDate, 7);
        } else if (task.frequency === 'MONTHLY') {
          nextDate = addDays(nextDate, 30);
        }

        if (isBefore(nextDate, today) || nextDate.toDateString() === today.toDateString()) {
          await this.prisma.maintenanceTask.create({
            data: {
              rangeId: task.rangeId,
              laneId: task.laneId,
              title: task.title,
              description: task.description,
              frequency: task.frequency,
              nextDueDate: nextDate,
              assignedToId: task.assignedToId,
              status: 'PENDING'
            }
          });
          
          this.logger.log(`Generated recurring task: ${task.title} for ${nextDate.toISOString()}`);
          
          await this.prisma.maintenanceTask.update({
            where: { id: task.id },
            data: { frequency: 'ONCE' }
          });
        }
      }
    }
  }

  async getStaffShifts(rangeId: string, start?: string, end?: string) {
    const where: any = { rangeId };
    if (start) where.startTime = { gte: new Date(start) };
    if (end) where.endTime = { lte: new Date(end) };
    
    return this.prisma.staffShift.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  async createStaffShift(rangeId: string, data: any) {
    return this.prisma.staffShift.create({
      data: {
        ...data,
        rangeId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime)
      }
    });
  }

  async clockInStaff(shiftId: string, userId: string) {
    return this.prisma.staffShift.updateMany({
      where: { id: shiftId, userId },
      data: { 
        status: 'ACTIVE',
        clockIn: new Date()
      }
    });
  }

  async clockOutStaff(shiftId: string, userId: string) {
    return this.prisma.staffShift.updateMany({
      where: { id: shiftId, userId },
      data: { 
        status: 'COMPLETED',
        clockOut: new Date()
      }
    });
  }

  async getBookings(rangeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookings = await this.prisma.booking.findMany({
      where: {
        slot: { rangeId },
        createdAt: { gte: today } // In a real app we'd query by TimeSlot date
      },
      include: {
        user: true,
        lane: true,
        slot: true
      }
    });

    return bookings.map(b => ({
      id: b.id,
      laneId: b.lane?.name || 'Unassigned',
      startTime: b.slot?.startTime.toISOString(),
      endTime: b.slot?.endTime.toISOString(),
      shooterName: b.user.name,
      type: 'Booking',
      status: b.status,
      caliber: 'N/A' // To be joined with Equipment/Session later
    }));
  }

  async getScheduleRequests(rangeId: string) {
    // Using Waitlist as a proxy for "pending schedule requests" for now
    const waitlist = await this.prisma.waitlist.findMany({
      include: {
        user: true
      }
    });

    return waitlist.map(w => ({
      id: w.id,
      shooterName: w.user.name,
      requestedDate: w.joinedAt.toISOString().split('T')[0],
      requestedTime: w.joinedAt.toISOString().split('T')[1].substring(0, 5),
      status: 'PENDING'
    }));
  }

  async getLanes(rangeId: string) {
    return this.prisma.rangeLane.findMany({
      where: { rangeId },
      include: {
        activeSession: {
          include: {
            shooter: { select: { id: true, name: true, role: true } }
          }
        },
        device: true
      },
      orderBy: { laneNumber: 'asc' }
    });
  }

  async updateLaneStatus(laneId: string, status: string, shooterId?: string, sessionType?: string) {
    const updateData: any = { status };
    if (status === 'AVAILABLE') {
      updateData.activeSessionId = null;
    }
    
    return this.prisma.rangeLane.update({
      where: { id: laneId },
      data: updateData,
      include: {
        activeSession: {
          include: {
            shooter: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });
  }

  async getWaitlist(rangeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const slots = await this.prisma.timeSlot.findMany({
      where: { rangeId, startTime: { gte: today, lt: tomorrow } },
      select: { id: true }
    });
    const slotIds = slots.map(s => s.id);

    if (slotIds.length === 0) return [];

    return this.prisma.waitlist.findMany({
      where: {
        slotId: { in: slotIds },
        notifiedAt: null
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { position: 'asc' }
    });
  }

  async getDashboardStats(rangeId: string) {
    const totalLanes = await this.prisma.rangeLane.count({ where: { rangeId } });
    const activeLanes = await this.prisma.rangeLane.count({ where: { rangeId, status: 'OCCUPIED' } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const slots = await this.prisma.timeSlot.findMany({
      where: { rangeId, startTime: { gte: today, lt: tomorrow } },
      select: { id: true }
    });
    const slotIds = slots.map(s => s.id);
    const waitlistDepth = slotIds.length > 0 
      ? await this.prisma.waitlist.count({ where: { slotId: { in: slotIds }, notifiedAt: null } })
      : 0;

    const checkins = await this.prisma.laneBooking.count({
      where: {
        rangeId,
        startTime: { gte: today, lt: tomorrow }
      }
    });

    const activeRSOs = await this.prisma.staffShift.count({
      where: {
        rangeId,
        role: 'RSO',
        status: 'ACTIVE',
        startTime: { gte: today, lt: tomorrow }
      }
    });
    const scheduledRSOs = await this.prisma.staffShift.count({
      where: {
        rangeId,
        role: 'RSO',
        startTime: { gte: today, lt: tomorrow }
      }
    });

    const range = await this.prisma.shootingRange.findUnique({
      where: { id: rangeId },
      select: { rangeStatus: true }
    });

    return {
      utilization: {
        totalLanes,
        activeLanes,
        percentage: totalLanes > 0 ? Math.round((activeLanes / totalLanes) * 100) : 0
      },
      waitlistDepth,
      dailyCheckins: checkins,
      rsoCoverage: {
        active: activeRSOs,
        scheduled: scheduledRSOs
      },
      rangeStatus: range?.rangeStatus || 'HOT'
    };
  }

  async updateRangeStatus(rangeId: string, status: string) {
    const range = await this.prisma.shootingRange.update({
      where: { id: rangeId },
      data: { rangeStatus: status }
    });
    return { success: true, status: range.rangeStatus };
  }

  async searchMembers(query: string) {
    if (!query || query.length < 2) return [];
    
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        membershipCards: true
      },
      take: 5
    });

    const result = await Promise.all(users.map(async (user) => {
      const sub = await this.prisma.membershipSubscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { tier: true }
      });
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        memberId: user.membershipCards[0]?.cardNumber || 'N/A',
        type: sub?.tier?.name || 'Walk-in Guest',
        status: sub?.status || 'ACTIVE',
        waiverSigned: true,
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
      };
    }));

    return result;
  }

  async checkInMember(rangeId: string, userId: string, partySize: number = 1) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const availableSlot = await this.prisma.timeSlot.findFirst({
      where: {
        rangeId,
        status: 'AVAILABLE',
        startTime: { gte: new Date(), lt: tomorrow }
      },
      include: { lane: true },
      orderBy: { startTime: 'asc' }
    });

    if (availableSlot) {
      await this.prisma.timeSlot.update({
        where: { id: availableSlot.id },
        data: { status: 'BOOKED' }
      });

      const booking = await this.prisma.laneBooking.create({
          data: {
            rangeId,
            userId,
            laneId: availableSlot.laneId,
            startTime: availableSlot.startTime,
            endTime: availableSlot.endTime
          }
      });
      
      if (availableSlot.lane) {
        await this.prisma.rangeLane.update({
          where: { id: availableSlot.lane.id },
          data: { status: 'OCCUPIED' }
        });
      }

      return { status: 'CHECKED_IN', laneNumber: availableSlot.lane?.laneNumber, bookingId: booking.id };
    } else {
      const nextSlot = await this.prisma.timeSlot.findFirst({
         where: { rangeId, startTime: { gte: new Date(), lt: tomorrow } },
         orderBy: { startTime: 'asc' }
      });
      if (!nextSlot) return { status: 'ERROR', message: 'No slots exist for today.' };

      const waitlistCount = await this.prisma.waitlist.count({ where: { slotId: nextSlot.id } });
      const waitlist = await this.prisma.waitlist.create({
          data: {
            slotId: nextSlot.id,
            userId,
            position: waitlistCount + 1
          }
      });
      return { status: 'WAITLISTED', position: waitlist.position, estimatedWait: waitlist.position * 15 };
    }
  }

  async getIncidents(rangeId: string) {
    return this.prisma.incidentReport.findMany({
      where: { rangeId },
      orderBy: { incidentDate: 'desc' }
    });
  }

  async createIncident(rangeId: string, data: any) {
    return this.prisma.incidentReport.create({
      data: {
        ...data,
        rangeId,
        incidentDate: new Date()
      }
    });
  }

  async getSafetyRules(rangeId: string) {
    return this.prisma.rangeSafetyRule.findMany({
      where: { rangeId },
      orderBy: { order: 'asc' }
    });
  }

  async getInventory(rangeId: string) {
    return this.prisma.rangeInventory.findMany({
      where: { rangeId },
      orderBy: { itemName: 'asc' }
    });
  }

  async addInventoryItem(rangeId: string, data: any) {
    return this.prisma.rangeInventory.create({
      data: {
        ...data,
        rangeId
      }
    });
  }

  async updateInventoryItem(itemId: string, data: any) {
    return this.prisma.rangeInventory.update({
      where: { id: itemId },
      data
    });
  }
}

