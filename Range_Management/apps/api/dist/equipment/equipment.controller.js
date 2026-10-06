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
exports.EquipmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const equipment_service_1 = require("./equipment.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_equipment_dto_1 = require("./dto/create-equipment.dto");
const update_equipment_dto_1 = require("./dto/update-equipment.dto");
let EquipmentController = class EquipmentController {
    constructor(equipmentService) {
        this.equipmentService = equipmentService;
    }
    findAll(req) {
        return this.equipmentService.findAll(req.user.id);
    }
    create(req, dto) {
        return this.equipmentService.create(req.user.id, dto);
    }
    update(id, req, dto) {
        return this.equipmentService.update(id, req.user.id, dto);
    }
    remove(id, req) {
        return this.equipmentService.remove(id, req.user.id);
    }
    addServiceLog(id, data) {
        return this.equipmentService.addServiceLog(id, data);
    }
    getAmmoLots(req) {
        return this.equipmentService.getAmmoLots(req.user.id);
    }
    addAmmoLot(req, data) {
        return this.equipmentService.addAmmoLot(req.user.id, data);
    }
    addReloadingLog(id, data) {
        return this.equipmentService.addReloadingLog(id, data);
    }
    addBallisticProfile(id, data) {
        return this.equipmentService.createBallisticProfile(id, data);
    }
};
exports.EquipmentController = EquipmentController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all equipment for the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all user equipment' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new equipment entry' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Equipment successfully created' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_equipment_dto_1.CreateEquipmentDto]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing equipment entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipment successfully updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_equipment_dto_1.UpdateEquipmentDto]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an equipment entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipment successfully deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/service-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a service log to equipment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "addServiceLog", null);
__decorate([
    (0, common_1.Get)('ammo-lots'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all ammo lots for user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "getAmmoLots", null);
__decorate([
    (0, common_1.Post)('ammo-lots'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new ammo lot' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "addAmmoLot", null);
__decorate([
    (0, common_1.Post)('ammo-lots/:id/reloading-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a reloading log to an ammo lot' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "addReloadingLog", null);
__decorate([
    (0, common_1.Post)(':id/ballistic-profiles'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a ballistic profile to equipment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "addBallisticProfile", null);
exports.EquipmentController = EquipmentController = __decorate([
    (0, swagger_1.ApiTags)('equipment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('equipment'),
    __metadata("design:paramtypes", [equipment_service_1.EquipmentService])
], EquipmentController);
//# sourceMappingURL=equipment.controller.js.map