import { IsString, IsInt, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
export enum LaneStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateLaneDto {
  @IsInt()
  laneNumber: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MaxLength(255)
  name?: string;

  @IsEnum(LaneStatus)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MaxLength(255)
  maxCaliber?: string;
}

export class UpdateLaneStatusDto {
  @IsEnum(LaneStatus)
  status: string;

  @IsUUID()
  @IsOptional()
  shooterId?: string; // The user assigned to the lane if marking OCCUPIED

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MaxLength(255)
  sessionType?: string; // E.g., '25m Pistol'
}
