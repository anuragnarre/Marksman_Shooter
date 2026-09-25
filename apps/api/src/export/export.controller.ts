import { Controller, Get, Param, Res, UseGuards, Req, Post } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('sessions/:id/issf-scoresheet')
  async exportIssfScoresheet(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.exportService.generateIssfScoresheet(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=issf_scoresheet_${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('excel')
  async exportExcel(@Req() req: any, @Res() res: Response) {
    const buffer = await this.exportService.generateExcelExport(req.user.id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=training_history_${req.user.id}.xlsx`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('sessions/:id/shareable-link')
  generateShareableLink(@Param('id') id: string) {
    const url = this.exportService.generateShareableLink(id);
    return { url };
  }
}
