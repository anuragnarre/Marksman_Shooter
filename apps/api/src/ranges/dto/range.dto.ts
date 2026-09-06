import { IsString, IsOptional, IsBoolean, IsInt, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateRangeDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateLaneDto {
  @IsInt()
  laneNumber: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class WalkInGuestDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  laneId: string;
}

export class BookLaneDto {
  @IsString()
  laneId: string;

  @IsString()
  userId: string; // Or guest id

  @IsString()
  startTime: string; // ISO

  @IsString()
  endTime: string; // ISO
}
