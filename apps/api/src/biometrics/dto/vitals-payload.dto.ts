// apps/api/src/biometrics/dto/vitals-payload.dto.ts
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class VitalsPayloadDto {
  @IsOptional()
  @IsEnum(['quick_estimate', 'optimal_read'])
  type?: 'quick_estimate' | 'optimal_read';

  @IsInt()
  @Min(30)
  @Max(250)
  @Transform(({ obj }) => obj.heartRate ?? obj.heart_rate)
  heartRate!: number;

  @IsInt()
  @Min(50)
  @Max(100)
  spo2!: number;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  timestamp?: string;
}
