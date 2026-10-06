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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EquipmentService = class EquipmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(userId) {
        return this.prisma.equipment.findMany({
            where: { userId },
            include: {
                optic: true,
                serviceLogs: true,
                ballisticProfiles: true
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    create(userId, dto) {
        return this.prisma.equipment.create({
            data: { ...dto, userId },
        });
    }
    update(id, userId, dto) {
        return this.prisma.equipment.update({
            where: { id },
            data: dto,
        });
    }
    remove(id, userId) {
        return this.prisma.equipment.delete({ where: { id } });
    }
    async addServiceLog(equipmentId, data) {
        return this.prisma.equipmentServiceLog.create({
            data: { ...data, equipmentId }
        });
    }
    async addAmmoLot(userId, data) {
        return this.prisma.ammoLot.create({
            data: {
                ...data,
                userId,
                inventory: {
                    create: { totalRounds: data.qty }
                }
            },
            include: { inventory: true }
        });
    }
    async getAmmoLots(userId) {
        return this.prisma.ammoLot.findMany({
            where: { userId },
            include: { inventory: true, reloadingLogs: true }
        });
    }
    async addReloadingLog(ammoLotId, data) {
        const log = await this.prisma.reloadingLog.create({
            data: { ...data, ammoLotId }
        });
        await this.prisma.ammoInventory.update({
            where: { ammoLotId },
            data: {
                totalRounds: { increment: data.roundsProduced }
            }
        });
        return log;
    }
    async createBallisticProfile(equipmentId, data) {
        return this.prisma.ballisticProfile.create({
            data: { ...data, equipmentId }
        });
    }
};
exports.EquipmentService = EquipmentService;
exports.EquipmentService = EquipmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EquipmentService);
//# sourceMappingURL=equipment.service.js.map