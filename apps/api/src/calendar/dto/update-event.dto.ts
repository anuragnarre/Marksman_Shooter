// apps/api/src/calendar/dto/update-event.dto.ts
import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray } from 'class-validator';
import type { EventType } from './create-event.dto';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['SESSION', 'TASK', 'PLAN', 'REMINDER', 'COMPETITION'])
  eventType?: EventType;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}
