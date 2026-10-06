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
exports.BallisticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ballistics_service_1 = require("./ballistics.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_ballistics_dto_1 = require("./dto/create-ballistics.dto");
let BallisticsController = class BallisticsController {
    constructor(ballisticsService) {
        this.ballisticsService = ballisticsService;
    }
    findAll(req) {
        return this.ballisticsService.findAll(req.user.id);
    }
    calculate(req, dto) {
        return this.ballisticsService.calculate(req.user.id, dto);
    }
    remove(id, req) {
        return this.ballisticsService.remove(id, req.user.id);
    }
};
exports.BallisticsController = BallisticsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all ballistic profiles' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of ballistic profiles' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BallisticsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('calculate'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate ballistic trajectory and save profile' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Calculated trajectory and saved profile' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ballistics_dto_1.CreateBallisticsDto]),
    __metadata("design:returntype", void 0)
], BallisticsController.prototype, "calculate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a ballistic profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile successfully deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BallisticsController.prototype, "remove", null);
exports.BallisticsController = BallisticsController = __decorate([
    (0, swagger_1.ApiTags)('ballistics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ballistics'),
    __metadata("design:paramtypes", [ballistics_service_1.BallisticsService])
], BallisticsController);
//# sourceMappingURL=ballistics.controller.js.map