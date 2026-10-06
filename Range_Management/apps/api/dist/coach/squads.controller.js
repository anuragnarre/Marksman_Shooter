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
exports.SquadsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const squads_service_1 = require("./squads.service");
let SquadsController = class SquadsController {
    constructor(squadsService) {
        this.squadsService = squadsService;
    }
    createSquad(req, data) {
        return this.squadsService.createSquad(req.user.id, data);
    }
    getMySquads(req) {
        return this.squadsService.getMySquads(req.user.id);
    }
    addMember(id, shooterId) {
        return this.squadsService.addMember(id, shooterId);
    }
    createGroupSession(id, req, data) {
        return this.squadsService.createGroupSession(req.user.id, id, data);
    }
};
exports.SquadsController = SquadsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new training squad' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SquadsController.prototype, "createSquad", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all squads managed by coach' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SquadsController.prototype, "getMySquads", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a shooter to a squad' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SquadsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Post)(':id/sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a group session for a squad' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SquadsController.prototype, "createGroupSession", null);
exports.SquadsController = SquadsController = __decorate([
    (0, swagger_1.ApiTags)('squads'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('squads'),
    __metadata("design:paramtypes", [squads_service_1.SquadsService])
], SquadsController);
//# sourceMappingURL=squads.controller.js.map