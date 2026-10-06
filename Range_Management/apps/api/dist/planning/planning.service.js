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
exports.PlanningService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlanningService = class PlanningService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDrills() {
        const count = await this.prisma.drill.count();
        if (count === 0) {
            await this.prisma.drill.createMany({
                data: [
                    {
                        coachId: 'system',
                        name: 'The Dot Drill',
                        description: 'Engage 5 small targets at varying distances. Tests foundational trigger control and sight alignment under mild time pressure.',
                        category: 'TRIGGER',
                        discipline: 'All',
                        timeLimit: 300,
                        rounds: 10,
                        distance: '25-50Y',
                        difficultyLevel: 'INTERMEDIATE',
                        isPublic: true,
                        tags: ['Precision']
                    },
                    {
                        coachId: 'system',
                        name: 'Rapid Engagement',
                        description: 'Multiple targets spread laterally. Focuses on smooth target acquisition and minimizing over-travel during transitions.',
                        category: 'POSITIONING',
                        discipline: 'All',
                        timeLimit: 150,
                        rounds: 15,
                        distance: '20Y',
                        difficultyLevel: 'ADVANCED',
                        isPublic: true,
                        tags: ['Speed / Transition']
                    },
                    {
                        coachId: 'system',
                        name: 'Trigger Reset Drill',
                        description: 'Slow-fire, single shot at a time with deliberate trigger reset. Eliminates flinch and builds clean follow-through habits.',
                        category: 'TRIGGER',
                        discipline: 'All',
                        timeLimit: 600,
                        rounds: 20,
                        distance: '10-25Y',
                        difficultyLevel: 'BEGINNER',
                        isPublic: true,
                        tags: ['Fundamentals']
                    },
                    {
                        coachId: 'system',
                        name: '60-Round Endurance',
                        description: 'Full competitive simulation. Six 10-round strings with 90-second intervals. Records split times and group sizes per string.',
                        category: 'BREATHING',
                        discipline: 'All',
                        timeLimit: 2700,
                        rounds: 60,
                        distance: '50Y',
                        difficultyLevel: 'ELITE',
                        isPublic: true,
                        tags: ['Endurance']
                    }
                ]
            });
        }
        return this.prisma.drill.findMany({
            where: { isPublic: true },
            orderBy: { createdAt: 'asc' }
        });
    }
    async saveSessionPlan(userId, data) {
        const { primaryFocus, objectives, shooterId } = data;
        const targetUserId = shooterId || userId;
        const content = {
            primaryFocus,
            objectives
        };
        return this.prisma.trainingPlan.create({
            data: {
                userId: targetUserId,
                content: content,
                weekStart: new Date(),
                focusAreas: [primaryFocus]
            }
        });
    }
    async getSessionPlan(shooterId) {
        return this.prisma.trainingPlan.findFirst({
            where: { userId: shooterId },
            orderBy: { generatedAt: 'desc' }
        });
    }
};
exports.PlanningService = PlanningService;
exports.PlanningService = PlanningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlanningService);
//# sourceMappingURL=planning.service.js.map