import { ExportService } from './export.service';
import { Response } from 'express';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportIssfScoresheet(id: string, res: Response): Promise<void>;
    exportExcel(req: any, res: Response): Promise<void>;
    generateShareableLink(id: string): {
        url: string;
    };
}
