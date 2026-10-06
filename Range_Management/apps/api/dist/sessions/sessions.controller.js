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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sessions_service_1 = require("./sessions.service");
const create_session_dto_1 = require("./dto/create-session.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let SessionsController = class SessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async create(user, shooterId, dto) {
        if (user.role === 'COACH' && !shooterId) {
            throw new common_1.BadRequestException('shooterId is required for coach-created sessions');
        }
        return this.sessionsService.createForActor(user.sub, user.role, dto, shooterId);
    }
    async findAll(user, shooterId) {
        if (user.role === 'COACH' && !shooterId) {
            throw new common_1.BadRequestException('shooterId is required for coach session listing');
        }
        return this.sessionsService.findAllForActor(user.sub, user.role, shooterId);
    }
    async findOne(user, id, shooterId) {
        return this.sessionsService.findOneWithShotsForActor(id, user.sub, user.role, shooterId);
    }
    async remove(user, id, shooterId) {
        return this.sessionsService.softDeleteForActor(id, user.sub, user.role, shooterId);
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new shooting session' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Session created successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'shooterId', required: false, description: 'Required for coaches creating a session for a shooter' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('shooterId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all shooting sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of sessions' }),
    (0, swagger_1.ApiQuery)({ name: 'shooterId', required: false, description: 'Required for coaches fetching sessions for a shooter' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific shooting session with shots' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session with its shots' }),
    (0, swagger_1.ApiQuery)({ name: 'shooterId', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a shooting session' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Session successfully deleted' }),
    (0, swagger_1.ApiQuery)({ name: 'shooterId', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "remove", null);
exports.SessionsController = SessionsController = __decorate([
    (0, swagger_1.ApiTags)('sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map