// apps/api/src/schedule-requests/dto/create-request.dto.ts
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateScheduleRequestDto {
  @IsString()
  eventId: string;

  @IsString()
  coachId: string;

  @IsOptional()
  @IsDateString()
  suggestedStart?: string;

  @IsOptional()
  @IsDateString()
  suggestedEnd?: string;

  @IsOptional()
  @IsString()
  suggestedTitle?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
