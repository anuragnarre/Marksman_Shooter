// apps/api/src/biometrics/dto/register-device.dto.ts
import { IsEnum, IsString, MinLength } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @MinLength(1)
  deviceName: string;

  @IsEnum(['CUSTOM_SENSOR', 'HEALTH_CONNECT', 'MANUAL'])
  deviceType: 'CUSTOM_SENSOR' | 'HEALTH_CONNECT' | 'MANUAL';
}
