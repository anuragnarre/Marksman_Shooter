// apps/api/src/coach/dto/create-feedback.dto.ts
import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'b5e1a3d9...', description: 'Session ID' })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ example: 'Great grouping, watch your breathing.', description: 'Coach feedback text' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  feedback!: string;
}
