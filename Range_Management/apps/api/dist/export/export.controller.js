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
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const export_service_1 = require("./export.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    async exportIssfScoresheet(id, res) {
        const buffer = await this.exportService.generateIssfScoresheet(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=issf_scoresheet_${id}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async exportExcel(req, res) {
        const buffer = await this.exportService.generateExcelExport(req.user.id);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=training_history_${req.user.id}.xlsx`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    generateShareableLink(id) {
        const url = this.exportService.generateShareableLink(id);
        return { url };
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)('sessions/:id/issf-scoresheet'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportIssfScoresheet", null);
__decorate([
    (0, common_1.Get)('excel'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Post)('sessions/:id/shareable-link'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExportController.prototype, "generateShareableLink", null);
exports.ExportController = ExportController = __decorate([
    (0, common_1.Controller)('export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map