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
exports.RangeOperationsController = void 0;
const common_1 = require("@nestjs/common");
const range_operations_service_1 = require("./range-operations.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const lane_dto_1 = require("./dto/lane.dto");
let RangeOperationsController = class RangeOperationsController {
    constructor(rangeOperationsService) {
        this.rangeOperationsService = rangeOperationsService;
    }
    async getShifts(rangeId, start, end) {
        return this.rangeOperationsService.getStaffShifts(rangeId, start, end);
    }
    async createShift(rangeId, data) {
        return this.rangeOperationsService.createStaffShift(rangeId, data);
    }
    async clockIn(shiftId, req) {
        return this.rangeOperationsService.clockInStaff(shiftId, req.user.id);
    }
    async clockOut(shiftId, req) {
        return this.rangeOperationsService.clockOutStaff(shiftId, req.user.id);
    }
    async getBookings(rangeId) {
        return this.rangeOperationsService.getBookings(rangeId);
    }
    async getScheduleRequests(rangeId) {
        return this.rangeOperationsService.getScheduleRequests(rangeId);
    }
    async getLanes(rangeId) {
        return this.rangeOperationsService.getLanes(rangeId);
    }
    async updateLaneStatus(laneId, body) {
        return this.rangeOperationsService.updateLaneStatus(laneId, body.status, body.shooterId, body.sessionType);
    }
    async getWaitlist(rangeId) {
        return this.rangeOperationsService.getWaitlist(rangeId);
    }
    async getDashboardStats(rangeId) {
        return this.rangeOperationsService.getDashboardStats(rangeId);
    }
    async updateRangeStatus(rangeId, status) {
        return this.rangeOperationsService.updateRangeStatus(rangeId, status);
    }
    async searchMembers(rangeId, q) {
        return this.rangeOperationsService.searchMembers(q);
    }
    async checkInMember(rangeId, userId, partySize) {
        return this.rangeOperationsService.checkInMember(rangeId, userId, partySize);
    }
    async getIncidents(rangeId) {
        return this.rangeOperationsService.getIncidents(rangeId);
    }
    async createIncident(rangeId, data) {
        return this.rangeOperationsService.createIncident(rangeId, data);
    }
    async getRules(rangeId) {
        return this.rangeOperationsService.getSafetyRules(rangeId);
    }
    async getStaffShifts(rangeId) {
        return this.rangeOperationsService.getStaffShifts(rangeId);
    }
    async getInventory(rangeId) {
        return this.rangeOperationsService.getInventory(rangeId);
    }
    async addInventoryItem(rangeId, data) {
        return this.rangeOperationsService.addInventoryItem(rangeId, data);
    }
    async updateInventoryItem(itemId, data) {
        return this.rangeOperationsService.updateInventoryItem(itemId, data);
    }
};
exports.RangeOperationsController = RangeOperationsController;
__decorate([
    (0, common_1.Get)(':rangeId/staff/shifts'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('rangeId')),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getShifts", null);
__decorate([
    (0, common_1.Post)(':rangeId/staff/shifts'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    __param(0, (0, common_1.Param)('rangeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "createShift", null);
__decorate([
    (0, common_1.Patch)('staff/shifts/:shiftId/clock-in'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'),
    __param(0, (0, common_1.Param)('shiftId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "clockIn", null);
__decorate([
    (0, common_1.Patch)('staff/shifts/:shiftId/clock-out'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'),
    __param(0, (0, common_1.Param)('shiftId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Get)(':rangeId/bookings'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getBookings", null);
__decorate([
    (0, common_1.Get)(':rangeId/schedule-requests'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getScheduleRequests", null);
__decorate([
    (0, common_1.Get)(':rangeId/lanes'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getLanes", null);
__decorate([
    (0, common_1.Patch)('lanes/:laneId/status'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('laneId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lane_dto_1.UpdateLaneStatusDto]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "updateLaneStatus", null);
__decorate([
    (0, common_1.Get)(':rangeId/waitlist'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getWaitlist", null);
__decorate([
    (0, common_1.Get)(':rangeId/dashboard-stats'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Patch)(':rangeId/status'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    __param(0, (0, common_1.Param)('rangeId')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "updateRangeStatus", null);
__decorate([
    (0, common_1.Get)(':rangeId/members/search'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'),
    __param(0, (0, common_1.Param)('rangeId')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "searchMembers", null);
__decorate([
    (0, common_1.Post)(':rangeId/check-in'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('rangeId')),
    __param(1, (0, common_1.Body)('userId')),
    __param(2, (0, common_1.Body)('partySize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "checkInMember", null);
__decorate([
    (0, common_1.Get)(':rangeId/incidents'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getIncidents", null);
__decorate([
    (0, common_1.Post)(':rangeId/incidents'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('rangeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "createIncident", null);
__decorate([
    (0, common_1.Get)(':rangeId/rules'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getRules", null);
__decorate([
    (0, common_1.Get)(':rangeId/staff/shifts'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getStaffShifts", null);
__decorate([
    (0, common_1.Get)(':rangeId/inventory'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Get range inventory' }),
    __param(0, (0, common_1.Param)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Post)(':rangeId/inventory'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new inventory item' }),
    __param(0, (0, common_1.Param)('rangeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "addInventoryItem", null);
__decorate([
    (0, common_1.Put)('inventory/:itemId'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an inventory item' }),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RangeOperationsController.prototype, "updateInventoryItem", null);
exports.RangeOperationsController = RangeOperationsController = __decorate([
    (0, common_1.Controller)('range-operations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [range_operations_service_1.RangeOperationsService])
], RangeOperationsController);
//# sourceMappingURL=range-operations.controller.js.map