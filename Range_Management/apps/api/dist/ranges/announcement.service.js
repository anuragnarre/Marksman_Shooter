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
var AnnouncementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const common_2 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnnouncementService = AnnouncementService_1 = class AnnouncementService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_2.Logger(AnnouncementService_1.name);
    }
    async createAnnouncement(rangeId, createdById, dto) {
        return this.prisma.rangeAnnouncement.create({
            data: {
                rangeId,
                createdById,
                title: dto.title,
                body: dto.body,
                type: dto.type ?? 'GENERAL',
                startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
                endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
                isActive: true,
            },
        });
    }
    async getActiveAnnouncements(rangeId) {
        const now = new Date();
        return this.prisma.rangeAnnouncement.findMany({
            where: {
                rangeId,
                isActive: true,
                OR: [{ endsAt: null }, { endsAt: { gte: now } }],
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deactivateAnnouncement(announcementId, rangeId) {
        const ann = await this.prisma.rangeAnnouncement.findFirst({
            where: { id: announcementId, rangeId },
        });
        if (!ann)
            throw new common_1.NotFoundException('Announcement not found');
        return this.prisma.rangeAnnouncement.update({
            where: { id: announcementId },
            data: { isActive: false },
        });
    }
    async deactivateExpired() {
        const result = await this.prisma.rangeAnnouncement.updateMany({
            where: { isActive: true, endsAt: { lt: new Date() } },
            data: { isActive: false },
        });
        this.logger.log(`Deactivated ${result.count} expired announcements`);
    }
};
exports.AnnouncementService = AnnouncementService;
__decorate([
    (0, schedule_1.Cron)('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnnouncementService.prototype, "deactivateExpired", null);
exports.AnnouncementService = AnnouncementService = AnnouncementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnnouncementService);
//# sourceMappingURL=announcement.service.js.map