// apps/api/src/biometrics/dto/vitals-payload.dto.ts
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class VitalsPayloadDto {
  @IsEnum(['quick_estimate', 'optimal_read'])
  type: 'quick_estimate' | 'optimal_read';

  @IsInt()
  @Min(30)
  @Max(250)
  heart_rate: number;

  @IsInt()
  @Min(50)
  @Max(100)
  spo2: number;
}
