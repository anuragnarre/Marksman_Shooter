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
exports.AiCoachController = void 0;
const common_1 = require("@nestjs/common");
const ai_coach_service_1 = require("./ai-coach.service");
const analyze_session_dto_1 = require("./dto/analyze-session.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AiCoachController = class AiCoachController {
    constructor(aiCoachService) {
        this.aiCoachService = aiCoachService;
    }
    async analyzeSession(user, dto) {
        return this.aiCoachService.analyzeSession(dto.sessionId, user.sub, user.role);
    }
    async performanceAssistant(user, shooterId) {
        return this.aiCoachService.analyzePerformance(user.sub, user.role, shooterId);
    }
};
exports.AiCoachController = AiCoachController;
__decorate([
    (0, common_1.Post)('analyze'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analyze_session_dto_1.AnalyzeSessionDto]),
    __metadata("design:returntype", Promise)
], AiCoachController.prototype, "analyzeSession", null);
__decorate([
    (0, common_1.Post)('performance-assistant'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiCoachController.prototype, "performanceAssistant", null);
exports.AiCoachController = AiCoachController = __decorate([
    (0, common_1.Controller)('ai-coach'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [ai_coach_service_1.AiCoachService])
], AiCoachController);
//# sourceMappingURL=ai-coach.controller.js.map