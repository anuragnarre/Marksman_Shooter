// apps/api/src/biometrics/dto/health-connect-sync.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class HealthConnectReadingDto {
  @IsDateString()
  timestamp: string;

  @IsOptional() @IsInt() @Min(30) @Max(250)
  heartRate?: number;

  @IsOptional() @IsInt() @Min(50) @Max(100)
  spo2?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(60)
  respiratoryRate?: number;

  @IsOptional() @IsInt() @Min(0)
  steps?: number;

  @IsOptional() @IsNumber() @Min(0)
  calories?: number;

  @IsOptional() @IsNumber() @Min(0)
  activeMinutes?: number;
}

export class HealthConnectSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HealthConnectReadingDto)
  @ArrayMaxSize(500)
  readings: HealthConnectReadingDto[];

  @IsOptional()
  @IsString()
  sessionId?: string;
}
