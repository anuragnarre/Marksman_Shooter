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
exports.BallisticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function computeTrajectory(profile) {
    const { muzzleVelocityFps, pelletWeightGrains, ballisticCoef, sightHeightInches, zeroRangeYards } = profile;
    const ranges = [0, 10, 25, 50, 75, 100];
    const rows = ranges.map((r) => {
        const t = r / muzzleVelocityFps;
        const drop = 0.5 * 32.174 * t * t * 12;
        const vel = Math.round(muzzleVelocityFps * Math.exp(-ballisticCoef * r * 0.1));
        const ke = (pelletWeightGrains * vel * vel) / 450400;
        return { range: r, drop: +drop.toFixed(2), vel, ke: +ke.toFixed(2) };
    });
    return rows;
}
let BallisticsService = class BallisticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(userId) {
        return this.prisma.ballisticProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async calculate(userId, dto) {
        const profile = dto;
        const trajectoryRows = computeTrajectory(profile);
        const saved = await this.prisma.ballisticProfile.upsert({
            where: { id: dto.id ?? 'new' },
            create: { ...profile, userId },
            update: { ...profile },
        }).catch(() => this.prisma.ballisticProfile.create({ data: { ...profile, userId } }));
        return { profile: saved, trajectory: trajectoryRows };
    }
    remove(id, userId) {
        return this.prisma.ballisticProfile.delete({ where: { id } });
    }
};
exports.BallisticsService = BallisticsService;
exports.BallisticsService = BallisticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BallisticsService);
//# sourceMappingURL=ballistics.service.js.map