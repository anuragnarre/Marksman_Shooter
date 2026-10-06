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
var ExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pdf_lib_1 = require("pdf-lib");
const ExcelJS = require("exceljs");
const jwt = require("jsonwebtoken");
const config_1 = require("@nestjs/config");
let ExportService = ExportService_1 = class ExportService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(ExportService_1.name);
    }
    async generateIssfScoresheet(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                shots: { orderBy: { timestamp: 'asc' } },
                shooter: { select: { name: true } },
            }
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        page.drawText('ISSF OFFICIAL SCORESHEET', { x: 50, y: 750, size: 20, font });
        page.drawText(`Shooter: ${session.shooter.name}`, { x: 50, y: 720, size: 12, font: regularFont });
        page.drawText(`Date: ${new Date(session.sessionDate).toLocaleDateString()}`, { x: 50, y: 700, size: 12, font: regularFont });
        page.drawText(`Discipline: ${session.discipline}`, { x: 300, y: 720, size: 12, font: regularFont });
        let yPos = 650;
        let seriesIndex = 0;
        let currentSeriesTotal = 0;
        session.shots.forEach((shot, index) => {
            if (index % 10 === 0) {
                if (index > 0) {
                    page.drawText(`Series Total: ${currentSeriesTotal.toFixed(1)}`, { x: 450, y: yPos + 20, size: 10, font: font });
                }
                seriesIndex++;
                yPos -= 30;
                page.drawText(`Series ${seriesIndex}`, { x: 50, y: yPos, size: 12, font });
                currentSeriesTotal = 0;
            }
            const xOffset = 150 + ((index % 10) * 30);
            page.drawText(shot.score.toFixed(1), { x: xOffset, y: yPos, size: 10, font: regularFont });
            currentSeriesTotal += shot.score;
        });
        if (session.shots.length > 0) {
            page.drawText(`Series Total: ${currentSeriesTotal.toFixed(1)}`, { x: 450, y: yPos, size: 10, font: font });
        }
        const totalScore = session.shots.reduce((acc, s) => acc + s.score, 0);
        page.drawText(`MATCH TOTAL: ${totalScore.toFixed(1)}`, { x: 50, y: yPos - 50, size: 16, font });
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
    async generateExcelExport(userId) {
        const sessions = await this.prisma.session.findMany({
            where: { shooterId: userId },
            include: { shots: true },
            orderBy: { sessionDate: 'desc' },
            take: 50
        });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Training History');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Discipline', key: 'discipline', width: 20 },
            { header: 'Total Score', key: 'score', width: 15 },
            { header: 'Shot Count', key: 'shots', width: 15 },
            { header: 'Average Shot', key: 'avg', width: 15 }
        ];
        sessions.forEach(session => {
            const totalScore = session.shots.reduce((acc, s) => acc + s.score, 0);
            const avg = session.shots.length > 0 ? (totalScore / session.shots.length).toFixed(2) : 0;
            sheet.addRow({
                date: new Date(session.sessionDate).toLocaleDateString(),
                discipline: session.discipline,
                score: totalScore.toFixed(1),
                shots: session.shots.length,
                avg
            });
        });
        sheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    generateShareableLink(sessionId) {
        const secret = this.config.get('JWT_SECRET') || 'default_secret';
        const token = jwt.sign({ sessionId, action: 'view_report' }, secret, { expiresIn: '7d' });
        const baseUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';
        return `${baseUrl}/reports/shared?token=${token}`;
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = ExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], ExportService);
//# sourceMappingURL=export.service.js.map