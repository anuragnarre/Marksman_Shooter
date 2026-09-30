// apps/api/src/ai-coach/dto/analyze-session.dto.ts
import { IsUUID } from 'class-validator';

export class AnalyzeSessionDto {
  @IsUUID()
  sessionId!: string;
}
