import {  IsString, IsOptional, IsBoolean, IsInt, IsEmail, MinLength } from 'class-validator';

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

export class UpdateLaneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class LogLaneInspectionDto {
  @IsBoolean()
  passed: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  checklistResult?: string;
}

