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
exports.SafetyController = void 0;
const common_1 = require("@nestjs/common");
const safety_service_1 = require("./safety.service");
let SafetyController = class SafetyController {
    constructor(safetyService) {
        this.safetyService = safetyService;
    }
    createIncidentReport(data) {
        return this.safetyService.createIncidentReport(data);
    }
    getAllIncidents() {
        return this.safetyService.getAllIncidents();
    }
    getIncidentById(id) {
        return this.safetyService.getIncidentById(id);
    }
    updateIncidentStatus(id, status) {
        return this.safetyService.updateIncidentStatus(id, status);
    }
    uploadIncidentPhoto(id, photoUrl) {
        return this.safetyService.uploadIncidentPhoto(id, photoUrl);
    }
    acknowledgeSafety(userId, rangeId) {
        return this.safetyService.acknowledgeSafety(userId, rangeId);
    }
    checkSafetyAcknowledgment(userId, rangeId) {
        return this.safetyService.checkSafetyAcknowledgment(userId, rangeId);
    }
    createQuiz(rangeId, data) {
        return this.safetyService.createQuiz(rangeId, data);
    }
    getQuizzes(rangeId) {
        return this.safetyService.getQuizzes(rangeId);
    }
    submitQuizAttempt(userId, quizId, score) {
        return this.safetyService.submitQuizAttempt(userId, quizId, score);
    }
    getFirstAidKits(rangeId) {
        return this.safetyService.getFirstAidKits(rangeId);
    }
    updateFirstAidKit(id, data) {
        return this.safetyService.updateFirstAidKit(id, data);
    }
    getAuditLogs(rangeId) {
        return this.safetyService.getAuditLogs(rangeId);
    }
};
exports.SafetyController = SafetyController;
__decorate([
    (0, common_1.Post)('incidents'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "createIncidentReport", null);
__decorate([
    (0, common_1.Get)('incidents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "getAllIncidents", null);
__decorate([
    (0, common_1.Get)('incidents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "getIncidentById", null);
__decorate([
    (0, common_1.Patch)('incidents/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "updateIncidentStatus", null);
__decorate([
    (0, common_1.Post)('incidents/:id/photo'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('photoUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "uploadIncidentPhoto", null);
__decorate([
    (0, common_1.Post)('acknowledgment'),
    __param(0, (0, common_1.Body)('userId')),
    __param(1, (0, common_1.Body)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "acknowledgeSafety", null);
__decorate([
    (0, common_1.Get)('acknowledgment'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "checkSafetyAcknowledgment", null);
__decorate([
    (0, common_1.Post)('quizzes'),
    __param(0, (0, common_1.Body)('rangeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "createQuiz", null);
__decorate([
    (0, common_1.Get)('quizzes'),
    __param(0, (0, common_1.Query)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "getQuizzes", null);
__decorate([
    (0, common_1.Post)('quizzes/attempt'),
    __param(0, (0, common_1.Body)('userId')),
    __param(1, (0, common_1.Body)('quizId')),
    __param(2, (0, common_1.Body)('score')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "submitQuizAttempt", null);
__decorate([
    (0, common_1.Get)('first-aid'),
    __param(0, (0, common_1.Query)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "getFirstAidKits", null);
__decorate([
    (0, common_1.Patch)('first-aid/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "updateFirstAidKit", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SafetyController.prototype, "getAuditLogs", null);
exports.SafetyController = SafetyController = __decorate([
    (0, common_1.Controller)('safety'),
    __metadata("design:paramtypes", [safety_service_1.SafetyService])
], SafetyController);
//# sourceMappingURL=safety.controller.js.map