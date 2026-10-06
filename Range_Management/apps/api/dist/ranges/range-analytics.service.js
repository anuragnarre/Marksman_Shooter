"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_fns_1 = require("date-fns");
let RangeAnalyticsService = class RangeAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardKpis(rangeId) {
        const now = new Date();
        const todayStart = (0, date_fns_1.startOfDay)(now);
        const todayEnd = (0, date_fns_1.addDays)(todayStart, 1);
        const monthStart = (0, date_fns_1.subMonths)(todayStart, 1);
        const [totalLanes, activeLanes, maintenanceLanes, todayBookings, activeMembers, monthlyCheckins,] = await Promise.all([
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
    async getHourlyUtilization(rangeId) {
        const since = (0, date_fns_1.subDays)(new Date(), 30);
        const bookings = await this.prisma.laneBooking.findMany({
            where: { rangeId, startTime: { gte: since } },
            select: { startTime: true, endTime: true },
        });
        const hourCounts = {};
        for (let h = 0; h < 24; h++)
            hourCounts[h] = 0;
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
    async getHeatmap(rangeId) {
        const since = (0, date_fns_1.subDays)(new Date(), 90);
        const bookings = await this.prisma.laneBooking.findMany({
            where: { rangeId, startTime: { gte: since } },
            select: { startTime: true },
        });
        const matrix = Array.from({ length: 7 }, () => new Array(24).fill(0));
        for (const b of bookings) {
            const day = b.startTime.getDay();
            const hour = b.startTime.getHours();
            matrix[day][hour]++;
        }
        return {
            days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            hours: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
            matrix,
        };
    }
    async getMemberRetention(rangeId) {
        const now = new Date();
        const d30 = (0, date_fns_1.subDays)(now, 30);
        const d60 = (0, date_fns_1.subDays)(now, 60);
        const d90 = (0, date_fns_1.subDays)(now, 90);
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
        const categories = { d30: [], d60: [], d90: [] };
        for (const sub of activeSubs) {
            const lastSeen = sub.user.sessions[0]?.sessionDate;
            if (!lastSeen) {
                categories.d90.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen: null });
                continue;
            }
            if (lastSeen < d90) {
                categories.d90.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen });
            }
            else if (lastSeen < d60) {
                categories.d60.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen });
            }
            else if (lastSeen < d30) {
                categories.d30.push({ userId: sub.userId, name: sub.user.name, email: sub.user.email, tier: sub.tier.name, lastSeen });
            }
        }
        return categories;
    }
    async getRevenueBreakdown(rangeId, fromDate, toDate) {
        const from = fromDate ? new Date(fromDate) : (0, date_fns_1.subMonths)(new Date(), 1);
        const to = toDate ? new Date(toDate) : new Date();
        const laneBookings = await this.prisma.laneBooking.aggregate({
            where: { rangeId, startTime: { gte: from, lte: to } },
            _sum: { amount: true },
            _count: { id: true },
        });
        const membershipSubs = await this.prisma.membershipSubscription.findMany({
            where: { createdAt: { gte: from, lte: to } },
            include: { tier: { select: { price: true, name: true } } },
        });
        const membershipRevenue = membershipSubs.reduce((sum, s) => sum + s.tier.price, 0);
        const membershipByTier = {};
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
    async getUpcomingClosures(rangeId) {
        const now = new Date();
        const in30 = (0, date_fns_1.addDays)(now, 30);
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
};
exports.RangeAnalyticsService = RangeAnalyticsService;
exports.RangeAnalyticsService = RangeAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RangeAnalyticsService);
//# sourceMappingURL=range-analytics.service.js.map