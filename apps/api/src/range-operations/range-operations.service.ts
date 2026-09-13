import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, isBefore } from 'date-fns';

@Injectable()
export class RangeOperationsService {
  private readonly logger = new Logger(RangeOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 2.1 Automated Waitlist & Lane Turnover
   * Runs every minute to check if there are available lanes/slots and notifies the first waitlist entry.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkWaitlistCapacity() {
    this.logger.debug('Running waitlist turnover check...');

    // 1. Find all available timeslots
    const availableSlots = await this.prisma.timeSlot.findMany({
      where: {
        status: 'AVAILABLE',
        startTime: {
          lte: addDays(new Date(), 1) // Only look at today/tomorrow
        }
      },
      include: {
        lane: true
      }
    });

    for (const slot of availableSlots) {
      // Find the first un-notified waitlist entry
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
        // Here we would integrate with an SMS/Email service (e.g. Twilio/SendGrid)
        this.logger.log(`Notifying User ${nextInLine.userId} for slot ${slot.id} in Lane ${slot.lane?.laneNumber || 'Any'}`);

        // Mark as notified
        await this.prisma.waitlist.update({
          where: { id: nextInLine.id },
          data: { notifiedAt: new Date() }
        });
      }
    }
  }

  /**
   * 2.4 Advanced Facility Maintenance Logging
   * Runs daily at midnight to find recurring tasks and schedule the next instance.
   */
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
      // Check if we already created the next occurrence
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
          // Create the next iteration
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
          
          // Mark the old one as ONCE so it doesn't get copied again
          await this.prisma.maintenanceTask.update({
            where: { id: task.id },
            data: { frequency: 'ONCE' }
          });
        }
      }
    }
  }

  /**
   * 2.3 Staff Rostering & Range Safety Coverage
   */
  async getStaffShifts(rangeId: string, start: string, end: string) {
    return this.prisma.staffShift.findMany({
      where: {
        rangeId,
        startTime: { gte: new Date(start) },
        endTime: { lte: new Date(end) }
      },
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
    // Basic implementation of digital check-in
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
}

