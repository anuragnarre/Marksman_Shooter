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
exports.ShotsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const platform_express_1 = require("@nestjs/platform-express");
const shots_service_1 = require("./shots.service");
const manual_shots_dto_1 = require("./dto/manual-shots.dto");
const update_shot_dto_1 = require("./dto/update-shot.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ShotsController = class ShotsController {
    constructor(shotsService) {
        this.shotsService = shotsService;
    }
    async importFromFile(user, file, sessionId, shooterId) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        if (!sessionId) {
            throw new common_1.BadRequestException('sessionId query parameter is required');
        }
        return this.shotsService.importFromFile(sessionId, user.sub, user.role, file, shooterId);
    }
    async createManual(user, dto, shooterId) {
        return this.shotsService.createManual(dto, user.sub, user.role, shooterId);
    }
    async analyzePhoto(user, file, sessionId, shooterId) {
        if (!file) {
            throw new common_1.BadRequestException('No image file uploaded');
        }
        if (!sessionId) {
            throw new common_1.BadRequestException('sessionId query parameter is required');
        }
        return this.shotsService.analyzePhoto(sessionId, user.sub, user.role, file, shooterId);
    }
    async analyzePhotoFull(user, file, sessionId, targetType, shooterId, save) {
        if (!file) {
            throw new common_1.BadRequestException('No image file uploaded');
        }
        if (!sessionId) {
            throw new common_1.BadRequestException('sessionId query parameter is required');
        }
        return this.shotsService.analyzePhotoFull(sessionId, user.sub, user.role, file, targetType ?? 'air_rifle_10m', shooterId, save !== 'false');
    }
    async deleteShot(user, shotId) {
        return this.shotsService.deleteShot(shotId, user.sub, user.role);
    }
    async updateShot(user, shotId, dto) {
        return this.shotsService.updateShot(shotId, user.sub, user.role, dto);
    }
    async liveFrame(body, engineKey) {
        const requiredKey = process.env.ENGINE_API_KEY;
        if (requiredKey && engineKey !== requiredKey) {
            throw new common_1.UnauthorizedException('Invalid engine API key');
        }
        if (!body.rangeId) {
            throw new common_1.BadRequestException('rangeId is required');
        }
        if (typeof body.x !== 'number' || typeof body.y !== 'number' || typeof body.score !== 'number') {
            throw new common_1.BadRequestException('x, y, score are required numbers');
        }
        return this.shotsService.processLiveFrame({
            rangeId: body.rangeId,
            sessionId: body.sessionId,
            x: body.x,
            y: body.y,
            score: body.score,
            pixelX: body.pixelX ?? 500,
            pixelY: body.pixelY ?? 500,
            targetType: body.targetType ?? 'air_rifle_10m',
            confidence: body.confidence,
            timestamp: body.timestamp,
        });
    }
};
exports.ShotsController = ShotsController;
__decorate([
    (0, common_1.Post)('import'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('sessionId')),
    __param(3, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], ShotsController.prototype, "importFromFile", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, manual_shots_dto_1.ManualShotsDto, Object]),
    __metadata("design:returntype", Promise)
], ShotsController.prototype, "createManual", null);
__decorate([
    (0, common_1.Post)('photo'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                cb(new common_1.BadRequestException('Only image files are accepted'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('sessionId')),
    __param(3, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], ShotsController.prototype, "analyzePhoto", null);
__decorate([
    (0, common_1.Post)('analyze-photo'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                cb(new common_1.BadRequestException('Only image files are accepted'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('sessionId')),
    __param(3, (0, common_1.Query)('targetType')),
    __param(4, (0, common_1.Query)('shooterId')),
    __param(5, (0, common_1.Query)('save')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], ShotsController.prototype, "analyzePhotoFull", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ShotsController.prototype, "deleteShot", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_shot_dto_1.UpdateShotDto]),
    __metadata("design:returntype", Promise)
], ShotsController.prototype, "updateShot", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('live-frame'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-engine-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ShotsController.prototype, "liveFrame", null);
exports.ShotsController = ShotsController = __decorate([
    (0, common_1.Controller)('shots'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [shots_service_1.ShotsService])
], ShotsController);
//# sourceMappingURL=shots.controller.js.map