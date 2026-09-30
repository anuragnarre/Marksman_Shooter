import { IsString, IsInt, IsOptional, IsEnum, IsUUID } from 'class-validator';

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
  name?: string;

  @IsEnum(LaneStatus)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
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
  sessionType?: string; // E.g., '25m Pistol'
}
