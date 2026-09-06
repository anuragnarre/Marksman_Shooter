// apps/api/src/calendar/dto/create-event.dto.ts
import {
  IsString, IsOptional, IsEnum, IsBoolean,
  IsDateString, IsArray, IsNumber, Min, Max, MaxLength
} from 'class-validator';

export type EventType = 'SESSION' | 'TASK' | 'PLAN' | 'REMINDER' | 'COMPETITION';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(['SESSION', 'TASK', 'PLAN', 'REMINDER', 'COMPETITION'])
  eventType: EventType = 'SESSION';

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

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

  @IsOptional()
  @IsEnum(['none', 'daily', 'weekly', 'biweekly', 'monthly'])
  recurringType?: RecurringType;

  @IsOptional()
  @IsDateString()
  recurringUntil?: string;
}
