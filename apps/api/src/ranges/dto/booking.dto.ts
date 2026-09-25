import { IsString, IsInt, IsOptional, IsBoolean, IsEnum, IsUUID, Min, Max, MaxLength, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetOperatingHoursDto {
  @ApiProperty({ example: 1, description: '0=Sunday … 6=Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  openTime: string;

  @ApiProperty({ example: '21:00' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  closeTime: string;

  @ApiPropertyOptional({ example: 60 })
  @IsInt()
  @Min(15)
  @Max(480)
  @IsOptional()
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;
}

export class CreateTimeSlotDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  laneId?: string;

  @ApiProperty({ example: '2026-09-25T09:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-09-25T10:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ enum: ['WALK_IN', 'RESERVATION_ONLY'] })
  @IsEnum(['WALK_IN', 'RESERVATION_ONLY'])
  @IsOptional()
  slotType?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  slotId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  laneId?: string;

  // Needed for recurring booking slot lookup
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  rangeId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  numberOfShooters?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  notes?: string;

  @ApiPropertyOptional({ enum: ['NONE', 'WEEKLY', 'BIWEEKLY'] })
  @IsEnum(['NONE', 'WEEKLY', 'BIWEEKLY'])
  @IsOptional()
  recurringType?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(300)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  reason?: string;
}

export class CheckInBookingDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  laneId?: string;
}

export class WalkInCheckInDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  numberOfShooters?: number;
}
