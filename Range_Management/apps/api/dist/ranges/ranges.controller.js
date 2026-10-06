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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangesController = void 0;
const public_decorator_1 = require("../auth/decorators/public.decorator");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const ranges_service_1 = require("./ranges.service");
const booking_service_1 = require("./booking.service");
const weather_service_1 = require("./weather.service");
const range_analytics_service_1 = require("./range-analytics.service");
const announcement_service_1 = require("./announcement.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const range_dto_1 = require("./dto/range.dto");
const booking_dto_1 = require("./dto/booking.dto");
const announcement_dto_1 = require("./dto/announcement.dto");
let RangesController = class RangesController {
    constructor(rangesService, bookingService, weatherService, analyticsService, announcementService) {
        this.rangesService = rangesService;
        this.bookingService = bookingService;
        this.weatherService = weatherService;
        this.analyticsService = analyticsService;
        this.announcementService = announcementService;
    }
    createRange(user, dto) {
        return this.rangesService.createRange(user.sub, dto);
    }
    getMyRanges(user) {
        return this.rangesService.getMyRanges(user.sub);
    }
    getRangeDetails(id) {
        return this.rangesService.getRangeDetails(id);
    }
    createLane(id, dto) {
        return this.rangesService.createLane(id, dto);
    }
    getLanes(id) {
        return this.rangesService.getLanes(id);
    }
    getLiveLanes(id) {
        return this.rangesService.getLanes(id);
    }
    updateLane(laneId, body) {
        return this.rangesService.updateLane(laneId, body);
    }
    updateLaneStatus(laneId, status) {
        return this.rangesService.updateLaneStatus(laneId, status);
    }
    logLaneInspection(rangeId, laneId, user, body) {
        return this.rangesService.logLaneInspection(laneId, user.sub, body);
    }
    linkSessionToLane(laneId, sessionId) {
        return this.rangesService.linkSessionToLane(laneId, sessionId);
    }
    clearLane(laneId) {
        return this.rangesService.clearLane(laneId);
    }
    getOperatingHours(id) {
        return this.bookingService.getOperatingHours(id);
    }
    setOperatingHours(id, dto) {
        return this.bookingService.setOperatingHours(id, dto);
    }
    createTimeSlot(id, dto) {
        return this.bookingService.createTimeSlot(id, dto);
    }
    getAvailability(id, date) {
        return this.bookingService.getAvailability(id, date);
    }
    walkInCheckIn(id, dto) {
        return this.bookingService.walkInCheckIn(id, dto.userId, dto.numberOfShooters);
    }
    validateAccess(id, userId) {
        return this.bookingService.validateAccess(id, userId);
    }
    getCurrentWeather(id) {
        return this.weatherService.getWeatherForRange(id);
    }
    getWeatherForecast(id) {
        return this.weatherService.getForecastForRange(id);
    }
    getEnvironmentLog(id, from, to) {
        return this.weatherService.getEnvironmentLog(id, from, to);
    }
    getWindScoreCorrelation(id) {
        return this.weatherService.getWindScoreCorrelation(id);
    }
    getDashboardKpis(id) {
        return this.analyticsService.getDashboardKpis(id);
    }
    getHourlyUtilization(id) {
        return this.analyticsService.getHourlyUtilization(id);
    }
    getHeatmap(id) {
        return this.analyticsService.getHeatmap(id);
    }
    getMemberRetention(id) {
        return this.analyticsService.getMemberRetention(id);
    }
    getRevenueBreakdown(id, from, to) {
        return this.analyticsService.getRevenueBreakdown(id, from, to);
    }
    getUpcomingClosures(id) {
        return this.analyticsService.getUpcomingClosures(id);
    }
    createAnnouncement(id, user, dto) {
        return this.announcementService.createAnnouncement(id, user.sub, dto);
    }
    getAnnouncements(id) {
        return this.announcementService.getActiveAnnouncements(id);
    }
    deleteAnnouncement(id, announcementId) {
        return this.announcementService.deactivateAnnouncement(announcementId, id);
    }
    bookLane(id, dto) {
        return this.rangesService.bookLane(id, dto);
    }
    async getLeaderboard(id) {
        return [
            { rank: 1, alias: 'Sniper99', elo: 1850, discipline: '10m Air Rifle' },
            { rank: 2, alias: 'AlphaTarget', elo: 1810, discipline: '10m Air Rifle' },
        ];
    }
    async getDigitalMembershipCard(req) {
        return { signedUrl: `https://storage.marksman.local/cards/${req.user.id}.pdf?sig=mock-signature`, expiry: Date.now() + 3600000 };
    }
    async createManualSlot(id, body) {
        return { success: true, rangeId: id, slotCreated: { startTime: body.startTime, endTime: body.endTime, laneId: body.laneId } };
    }
    async updateRangeRules(id, rules) {
        return { success: true, rangeId: id, rulesUpdated: true };
    }
    async getRangeRules(id) {
        return { rangeId: id, rules: '# Safety First\n1. Always point muzzle downrange.' };
    }
    async issueGuestPass(id, guestName, validUntil) {
        return { success: true, passId: 'GP-' + Date.now(), guestName, validUntil };
    }
};
exports.RangesController = RangesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new shooting range' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, range_dto_1.CreateRangeDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "createRange", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'List my ranges' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getMyRanges", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get range details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getRangeDetails", null);
__decorate([
    (0, common_1.Post)(':id/lanes'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.1 Add a lane to the range' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, range_dto_1.CreateLaneDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "createLane", null);
__decorate([
    (0, common_1.Get)(':id/lanes'),
    (0, swagger_1.ApiOperation)({ summary: '2.1 List all lanes with live status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getLanes", null);
__decorate([
    (0, common_1.Get)(':id/lanes/live'),
    (0, swagger_1.ApiOperation)({ summary: '2.1.5 Real-time lane status board' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getLiveLanes", null);
__decorate([
    (0, common_1.Patch)(':id/lanes/:laneId'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    (0, swagger_1.ApiOperation)({ summary: '2.1 Update lane details' }),
    __param(0, (0, common_1.Param)('laneId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, range_dto_1.UpdateLaneDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "updateLane", null);
__decorate([
    (0, common_1.Patch)(':id/lanes/:laneId/status'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    (0, swagger_1.ApiOperation)({ summary: '2.1 Change lane status (RSO use)' }),
    __param(0, (0, common_1.Param)('laneId')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "updateLaneStatus", null);
__decorate([
    (0, common_1.Post)(':id/lanes/:laneId/inspection'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    (0, swagger_1.ApiOperation)({ summary: '2.1.7 Log lane inspection' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('laneId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, range_dto_1.LogLaneInspectionDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "logLaneInspection", null);
__decorate([
    (0, common_1.Put)('lanes/:laneId/link-session'),
    (0, swagger_1.ApiOperation)({ summary: '2.1.3 Assign session to a lane' }),
    __param(0, (0, common_1.Param)('laneId')),
    __param(1, (0, common_1.Body)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "linkSessionToLane", null);
__decorate([
    (0, common_1.Put)('lanes/:laneId/clear'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    (0, swagger_1.ApiOperation)({ summary: '2.1.4 Release / clear a lane' }),
    __param(0, (0, common_1.Param)('laneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "clearLane", null);
__decorate([
    (0, common_1.Get)(':id/operating-hours'),
    (0, swagger_1.ApiOperation)({ summary: '2.2 Get operating hours config' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getOperatingHours", null);
__decorate([
    (0, common_1.Post)(':id/operating-hours'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.2 Set operating hours for a day-of-week' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.SetOperatingHoursDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "setOperatingHours", null);
__decorate([
    (0, common_1.Post)(':id/slots'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.2 Manually create a time slot' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.CreateTimeSlotDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "createTimeSlot", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({ summary: '2.2.4 Public slot availability matrix for a date (no auth)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, example: '2026-09-25' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Post)(':id/walk-in'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: '2.2.8 Instant walk-in check-in' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.WalkInCheckInDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "walkInCheckIn", null);
__decorate([
    (0, common_1.Get)(':id/validate-access'),
    (0, throttler_1.SkipThrottle)(),
    (0, swagger_1.ApiOperation)({ summary: '2.3.7 Validate user access — used by turnstile hardware' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: true }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "validateAccess", null);
__decorate([
    (0, common_1.Get)(':id/weather'),
    (0, swagger_1.ApiOperation)({ summary: '2.4 Current weather conditions at range (15-min cache)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getCurrentWeather", null);
__decorate([
    (0, common_1.Get)(':id/weather/forecast'),
    (0, swagger_1.ApiOperation)({ summary: '2.4.5 7-day weather forecast for range' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getWeatherForecast", null);
__decorate([
    (0, common_1.Get)(':id/environment-log'),
    (0, swagger_1.ApiOperation)({ summary: '2.4.3 Historical environment readings' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getEnvironmentLog", null);
__decorate([
    (0, common_1.Get)(':id/wind-score-correlation'),
    (0, swagger_1.ApiOperation)({ summary: '2.4.4 Wind speed vs avg score scatter data' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getWindScoreCorrelation", null);
__decorate([
    (0, common_1.Get)(':id/dashboard'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    (0, swagger_1.ApiOperation)({ summary: '2.5.1 Full KPI dashboard stats' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getDashboardKpis", null);
__decorate([
    (0, common_1.Get)(':id/analytics/hourly-utilization'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.5.2 Hourly lane utilization chart (last 30 days)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getHourlyUtilization", null);
__decorate([
    (0, common_1.Get)(':id/analytics/heatmap'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.5.3 Day-of-week × hour utilization heatmap' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getHeatmap", null);
__decorate([
    (0, common_1.Get)(':id/analytics/member-retention'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.5.4 Member retention buckets (30/60/90 days inactive)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getMemberRetention", null);
__decorate([
    (0, common_1.Get)(':id/analytics/revenue'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.5.5 Revenue breakdown by source' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getRevenueBreakdown", null);
__decorate([
    (0, common_1.Get)(':id/analytics/upcoming-closures'),
    (0, swagger_1.ApiOperation)({ summary: '2.5.6 Upcoming maintenance & closure calendar' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getUpcomingClosures", null);
__decorate([
    (0, common_1.Post)(':id/announcements'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '2.6.5 Post a range announcement / closure notice' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, announcement_dto_1.CreateAnnouncementDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "createAnnouncement", null);
__decorate([
    (0, common_1.Get)(':id/announcements'),
    (0, swagger_1.ApiOperation)({ summary: '2.6.5 Get active announcements for a range' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "getAnnouncements", null);
__decorate([
    (0, common_1.Delete)(':id/announcements/:announcementId'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate an announcement' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('announcementId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "deleteAnnouncement", null);
__decorate([
    (0, common_1.Post)(':id/bookings'),
    (0, swagger_1.ApiOperation)({ summary: 'Legacy: book a lane (LaneBooking model)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, range_dto_1.BookLaneDto]),
    __metadata("design:returntype", void 0)
], RangesController.prototype, "bookLane", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/leaderboard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangesController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('membership-card/signed-url'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RangesController.prototype, "getDigitalMembershipCard", null);
__decorate([
    (0, common_1.Post)(':id/slots'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RangesController.prototype, "createManualSlot", null);
__decorate([
    (0, common_1.Post)(':id/rules'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'RANGE_OPERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('rules')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RangesController.prototype, "updateRangeRules", null);
__decorate([
    (0, common_1.Get)(':id/rules'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangesController.prototype, "getRangeRules", null);
__decorate([
    (0, common_1.Post)(':id/guest-passes/issue'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'RANGE_OPERATOR', 'RSO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('guestName')),
    __param(2, (0, common_1.Body)('validUntil')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RangesController.prototype, "issueGuestPass", null);
exports.RangesController = RangesController = __decorate([
    (0, swagger_1.ApiTags)('Ranges'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ranges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [ranges_service_1.RangesService,
        booking_service_1.BookingService,
        weather_service_1.WeatherService,
        range_analytics_service_1.RangeAnalyticsService,
        announcement_service_1.AnnouncementService])
], RangesController);
//# sourceMappingURL=ranges.controller.js.map