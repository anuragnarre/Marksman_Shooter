import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, startOfDay, subDays, subMonths } from 'date-fns';

@Injectable()
export class RangeAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 2.5.1 Full KPI dashboard stats
   */
  async getDashboardKpis(rangeId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = addDays(todayStart, 1);
    const monthStart = subMonths(todayStart, 1);

    const [
      totalLanes,
      activeLanes,
      maintenanceLanes,
      todayBookings,
      activeMembers,
      monthlyCheckins,
    ] = await Promise.all([
      this.prisma.rangeLane.count({ where: { rangeId } }),
      this.prisma.rangeLane.count({ where: { rangeId, status: 'OCCUPIED' } }),
      this.prisma.rangeLane.count({ where: { rangeId, status: 'MAINTENANCE' } }),
      this.prisma.booking.count({
        where: {
          slot: { rangeId, startTime: { gte: todayStart, lt: todayEnd } },
          status: { not: 'CANCELLED' },
        },
      }),
      this.prisma.membershipSubscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.laneBooking.count({
        where: { rangeId, startTime: { gte: monthStart, lt: now } },
      }),
    ]);

    const range = await this.prisma.shootingRange.findUnique({
      where: { id: rangeId },
      select: { rangeStatus: true },
    });

    const activeRSOs = await this.prisma.staffShift.count({
      where: {
        rangeId,
        role: 'RSO',
        status: 'ACTIVE',
        startTime: { gte: todayStart, lt: todayEnd },
      },
    });

    return {
      laneUtilization: {
        total: totalLanes,
        active: activeLanes,
        maintenance: maintenanceLanes,
        available: totalLanes - activeLanes - maintenanceLanes,
        pct: totalLanes > 0 ? Math.round((activeLanes / totalLanes) * 100) : 0,
      },
      bookingsToday: todayBookings,
      activeMembers,
      monthlyCheckins,
      activeRSOs,
      rangeStatus: range?.rangeStatus ?? 'HOT',
    };
  }

  /**
   * 2.5.2 Hourly utilization chart — lane-hours per hour averaged over last 30 days
   */
  async getHourlyUtilization(rangeId: string) {
    const since = subDays(new Date(), 30);

    const bookings = await this.prisma.laneBooking.findMany({
      where: { rangeId, startTime: { gte: since } },
      select: { startTime: true, endTime: true },
    });

    // Accumulate lane-hours per hour bucket (0–23)
    const hourCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;

    for (const b of bookings) {
      const startH = b.startTime.getHours();
      const endH = b.endTime.getHours();
      for (let h = startH; h <= endH && h < 24; h++) {
        hourCounts[h]++;
      }
    }

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      label: `${hour.padStart(2, '0')}:00`,
      laneHours: count,
    }));
  }

  /**
   * 2.5.3 Day-of-week × hour utilization heatmap
   */
  async getHeatmap(rangeId: string) {
    const since = subDays(new Date(), 90);

    const bookings = await this.prisma.laneBooking.findMany({
      where: { rangeId, startTime: { gte: since } },
      select: { startTime: true },
    });

    // 7×24 matrix
    const matrix: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

    for (const b of bookings) {
      const day = b.startTime.getDay(); // 0=Sun
      const hour = b.startTime.getHours();
      matrix[day][hour]++;
    }

    return {
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hours: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
      matrix,
    };
  }

  /**
   * 2.5.4 Member retention — members not seen in 30 / 60 / 90 days
   */
  async getMemberRetention(rangeId: string) {
    const now = new Date();
    const d30 = subDays(now, 30);
    const d60 = subDays(now, 60);
    const d90 = subDays(now, 90);

    // Get all active members
    const activeSubs = await this.prisma.membershipSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            sessions: {
              where: { deletedAt: null },
              orderBy: { sessionDate: 'desc' },
              take: 1,
              select: { sessionDate: true },
            },
          },
        },
        tier: { select: { name: true } },
      },
    });

    const categories = { d30: [] as any[], d60: [] as any[], d90: [] as any[] };

    for (const sub of activeSubs) {
      const lastSeen = sub.user.sessions[0]?.sessionDate;
      if (!lastSeen) {
        categories.d90.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen: null });
        continue;
      }
      if (lastSeen < d90) {
        categories.d90.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen });
      } else if (lastSeen < d60) {
        categories.d60.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen });
      } else if (lastSeen < d30) {
        categories.d30.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen });
      }
    }

    return categories;
  }

  /**
   * 2.5.5 Revenue breakdown by source
   */
  async getRevenueBreakdown(rangeId: string, fromDate?: string, toDate?: string) {
    const from = fromDate ? new Date(fromDate) : subMonths(new Date(), 1);
    const to = toDate ? new Date(toDate) : new Date();

    const laneBookings = await this.prisma.laneBooking.aggregate({
      where: { rangeId, startTime: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Memberships: count subscriptions created in period
    const membershipSubs = await this.prisma.membershipSubscription.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { tier: { select: { price: true, name: true } } },
    });

    const membershipRevenue = membershipSubs.reduce((sum, s) => sum + s.tier.price, 0);
    const membershipByTier: Record<string, number> = {};
    for (const s of membershipSubs) {
      membershipByTier[s.tier.name] = (membershipByTier[s.tier.name] ?? 0) + s.tier.price;
    }

    return {
      period: { from, to },
      laneBookings: {
        total: laneBookings._sum.amount ?? 0,
        count: laneBookings._count.id,
      },
      memberships: {
        total: membershipRevenue,
        count: membershipSubs.length,
        byTier: membershipByTier,
      },
      grandTotal: (laneBookings._sum.amount ?? 0) + membershipRevenue,
    };
  }

  /**
   * 2.5.6 Upcoming closures/maintenance in the next 30 days
   */
  async getUpcomingClosures(rangeId: string) {
    const now = new Date();
    const in30 = addDays(now, 30);

    const [maintenanceTasks, announcements] = await Promise.all([
      this.prisma.maintenanceTask.findMany({
        where: {
          rangeId,
          nextDueDate: { gte: now, lte: in30 },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        include: { lane: { select: { laneNumber: true } }, assignedTo: { select: { name: true } } },
        orderBy: { nextDueDate: 'asc' },
      }),
      this.prisma.rangeAnnouncement.findMany({
        where: {
          rangeId,
          isActive: true,
          type: { in: ['CLOSURE', 'MAINTENANCE'] },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
        orderBy: { startsAt: 'asc' },
      }),
    ]);

    return { maintenanceTasks, announcements };
  }
}
