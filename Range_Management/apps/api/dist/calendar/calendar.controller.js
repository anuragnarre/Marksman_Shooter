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
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const calendar_service_1 = require("./calendar.service");
const create_event_dto_1 = require("./dto/create-event.dto");
const update_event_dto_1 = require("./dto/update-event.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CalendarController = class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    async getEvents(user, start, end) {
        const s = start || new Date(Date.now() - 30 * 86400000).toISOString();
        const e = end || new Date(Date.now() + 90 * 86400000).toISOString();
        if (user.role === 'COACH') {
            return this.calendarService.getCoachEvents(user.sub, s, e);
        }
        return this.calendarService.getShooterEvents(user.sub, s, e);
    }
    async createEvent(user, dto) {
        return this.calendarService.createEvent(user.sub, user.role, dto);
    }
    async updateEvent(user, id, dto) {
        return this.calendarService.updateEvent(user.sub, user.role, id, dto);
    }
    async deleteEvent(user, id) {
        return this.calendarService.deleteEvent(user.sub, user.role, id);
    }
    async deleteRecurring(user, groupId) {
        return this.calendarService.deleteRecurringGroup(user.sub, user.role, groupId);
    }
    async getShooters(user) {
        return this.calendarService.getConnectedShooters(user.sub);
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, roles_decorator_1.Roles)('COACH', 'SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Put)('events/:id'),
    (0, roles_decorator_1.Roles)('COACH', 'SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_event_dto_1.UpdateEventDto]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.Delete)('events/:id'),
    (0, roles_decorator_1.Roles)('COACH', 'SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteEvent", null);
__decorate([
    (0, common_1.Delete)('events/recurring/:groupId'),
    (0, roles_decorator_1.Roles)('COACH', 'SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteRecurring", null);
__decorate([
    (0, common_1.Get)('shooters'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getShooters", null);
exports.CalendarController = CalendarController = __decorate([
    (0, common_1.Controller)('calendar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map