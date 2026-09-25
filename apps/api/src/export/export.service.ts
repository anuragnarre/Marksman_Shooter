import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as ExcelJS from 'exceljs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async generateIssfScoresheet(sessionId: string): Promise<Buffer> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        shots: { orderBy: { timestamp: 'asc' } },
        shooter: { select: { name: true } },
      }
    });

    if (!session) throw new NotFoundException('Session not found');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

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

  async generateExcelExport(userId: string): Promise<Buffer> {
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

  generateShareableLink(sessionId: string): string {
    const secret = this.config.get<string>('JWT_SECRET') || 'default_secret';
    const token = jwt.sign({ sessionId, action: 'view_report' }, secret, { expiresIn: '7d' });
    const baseUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${baseUrl}/reports/shared?token=${token}`;
  }
}
