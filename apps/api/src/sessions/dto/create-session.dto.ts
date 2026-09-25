// apps/api/src/sessions/dto/create-session.dto.ts
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 'Target Shooting', description: 'Discipline name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  discipline!: string;

  @ApiProperty({ example: 50, description: 'Distance in yards or meters' })
  @IsInt()
  @Min(1)
  @Max(1000)
  distance!: number;

  @ApiProperty({ example: 'Air Rifle', description: 'Type of weapon used' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  weaponType!: string;

  @ApiProperty({ example: 60, description: 'Number of shots fired' })
  @IsInt()
  @Min(1)
  @Max(1000)
  numberOfShots!: number;

  @ApiProperty({ example: '2023-10-01T10:00:00Z', description: 'Date of the session' })
  @IsDateString()
  sessionDate!: string;

  @ApiPropertyOptional({ example: 'Prone', description: 'Training mode/position' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  trainingMode?: string;

  @ApiPropertyOptional({ example: 'uuid-range-id', description: 'Range ID for weather enrichment' })
  @IsOptional()
  @IsString()
  rangeId?: string;
}
