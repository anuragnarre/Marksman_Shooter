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
exports.ScheduleRequestsController = void 0;
const common_1 = require("@nestjs/common");
const schedule_requests_service_1 = require("./schedule-requests.service");
const create_request_dto_1 = require("./dto/create-request.dto");
const resolve_request_dto_1 = require("./dto/resolve-request.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ScheduleRequestsController = class ScheduleRequestsController {
    constructor(service) {
        this.service = service;
    }
    create(user, dto) {
        return this.service.createRequest(user.sub, dto);
    }
    getAll(user) {
        return this.service.getRequests(user.sub, user.role);
    }
    getPendingCount(user) {
        return this.service.getPendingCount(user.sub);
    }
    resolve(user, id, dto) {
        return this.service.resolveRequest(user.sub, id, dto);
    }
    cancel(user, id) {
        return this.service.cancelRequest(user.sub, id);
    }
};
exports.ScheduleRequestsController = ScheduleRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_request_dto_1.CreateScheduleRequestDto]),
    __metadata("design:returntype", void 0)
], ScheduleRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScheduleRequestsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('pending-count'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScheduleRequestsController.prototype, "getPendingCount", null);
__decorate([
    (0, common_1.Put)(':id/resolve'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resolve_request_dto_1.ResolveRequestDto]),
    __metadata("design:returntype", void 0)
], ScheduleRequestsController.prototype, "resolve", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ScheduleRequestsController.prototype, "cancel", null);
exports.ScheduleRequestsController = ScheduleRequestsController = __decorate([
    (0, common_1.Controller)('schedule-requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [schedule_requests_service_1.ScheduleRequestsService])
], ScheduleRequestsController);
//# sourceMappingURL=schedule-requests.controller.js.map