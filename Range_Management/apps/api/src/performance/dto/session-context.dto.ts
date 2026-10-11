// apps/api/src/performance/dto/session-context.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SessionContextDto {
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(250)
  heartRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perceivedEffort?: number;

  @IsOptional()
  @IsString()
  windCondition?: string;

  @IsOptional()
  @IsNumber()
  @Min(-40)
  @Max(60)
  temperature?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
