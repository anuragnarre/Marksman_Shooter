import { AiCoachService } from './ai-coach.service';
import { AnalyzeSessionDto } from './dto/analyze-session.dto';
import { AiCoachAnalysis, AiPerformanceAssistant, JwtPayload } from '@shooting-platform/shared-types';
export declare class AiCoachController {
    private readonly aiCoachService;
    constructor(aiCoachService: AiCoachService);
    analyzeSession(user: JwtPayload, dto: AnalyzeSessionDto): Promise<AiCoachAnalysis>;
    performanceAssistant(user: JwtPayload, shooterId: string | undefined): Promise<AiPerformanceAssistant>;
}
