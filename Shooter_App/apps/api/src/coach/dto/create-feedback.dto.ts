// apps/api/src/coach/dto/create-feedback.dto.ts
import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  feedback!: string;
}
