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
exports.BiometricsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const device_auth_guard_1 = require("./guards/device-auth.guard");
const biometrics_service_1 = require("./biometrics.service");
const biometrics_ai_service_1 = require("./biometrics-ai.service");
const register_device_dto_1 = require("./dto/register-device.dto");
const vitals_payload_dto_1 = require("./dto/vitals-payload.dto");
const health_connect_sync_dto_1 = require("./dto/health-connect-sync.dto");
let BiometricsController = class BiometricsController {
    constructor(biometricsService, biometricsAiService) {
        this.biometricsService = biometricsService;
        this.biometricsAiService = biometricsAiService;
    }
    async registerDevice(user, dto) {
        return this.biometricsService.registerDevice(user.sub, dto.deviceName, dto.deviceType);
    }
    async listDevices(user) {
        return this.biometricsService.listDevices(user.sub);
    }
    async toggleDevice(user, id, isActive) {
        return this.biometricsService.toggleDevice(user.sub, id, isActive);
    }
    async deleteDevice(user, id) {
        return this.biometricsService.deleteDevice(user.sub, id);
    }
    async getDeviceDetail(user, id) {
        return this.biometricsService.getDeviceDetail(user.sub, id);
    }
    async ingestVitals(req, dto) {
        return this.biometricsService.ingestVitals(req.device.id, req.deviceUserId, dto.type ?? 'quick_estimate', dto.heartRate, dto.spo2);
    }
    async syncHealthConnect(user, dto) {
        return this.biometricsService.syncHealthConnect(user.sub, dto.readings, dto.sessionId);
    }
    async getReadings(user, sessionId, deviceId, from, to, limit) {
        return this.biometricsService.getReadings(user.sub, {
            sessionId, deviceId, from, to,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    async getSessionSummary(user, sessionId) {
        return this.biometricsService.getSessionSummary(sessionId, user.sub);
    }
    async getAiAnalysis(user, sessionId) {
        return this.biometricsAiService.analyzeSessionBiometrics(sessionId, user.sub);
    }
    async getAdvancedInsights(user, days) {
        return this.biometricsAiService.generateAdvancedInsights(user.sub, days ? parseInt(days, 10) : 30);
    }
    async getTrends(user, days) {
        return this.biometricsService.getTrends(user.sub, days ? parseInt(days, 10) : 30);
    }
    async getLatestReading(user, userId) {
        if (user.sub !== userId && user.role !== 'COACH') {
            throw new common_1.ForbiddenException('Cannot access another user\'s biometric data');
        }
        return this.biometricsService.getLatestReading(userId);
    }
};
exports.BiometricsController = BiometricsController;
__decorate([
    (0, common_1.Post)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_device_dto_1.RegisterDeviceDto]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "listDevices", null);
__decorate([
    (0, common_1.Patch)('devices/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "toggleDevice", null);
__decorate([
    (0, common_1.Delete)('devices/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "deleteDevice", null);
__decorate([
    (0, common_1.Get)('devices/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "getDeviceDetail", null);
__decorate([
    (0, common_1.Post)('vitals'),
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, vitals_payload_dto_1.VitalsPayloadDto]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "ingestVitals", null);
__decorate([
    (0, common_1.Post)('health-connect/sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, health_connect_sync_dto_1.HealthConnectSyncDto]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "syncHealthConnect", null);
__decorate([
    (0, common_1.Get)('readings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('sessionId')),
    __param(2, (0, common_1.Query)('deviceId')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "getReadings", null);
__decorate([
    (0, common_1.Get)('session/:sessionId/summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "getSessionSummary", null);
__decorate([
    (0, common_1.Get)('session/:sessionId/ai-analysis'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "getAiAnalysis", null);
__decorate([
    (0, common_1.Get)('advanced-insights'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "getAdvancedInsights", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('live/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BiometricsController.prototype, "getLatestReading", null);
exports.BiometricsController = BiometricsController = __decorate([
    (0, common_1.Controller)('biometrics'),
    __metadata("design:paramtypes", [biometrics_service_1.BiometricsService,
        biometrics_ai_service_1.BiometricsAiService])
], BiometricsController);
//# sourceMappingURL=biometrics.controller.js.map