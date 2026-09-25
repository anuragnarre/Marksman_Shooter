import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsNumber, Min, Max, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RangeStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Maintenance = 'Maintenance',
}

export class CreateRangeDto {
  @ApiProperty({ example: 'Main Shooting Range', description: 'Name of the range' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ enum: RangeStatus, example: RangeStatus.Active })
  @IsEnum(RangeStatus)
  @IsOptional()
  status?: RangeStatus;

  @ApiPropertyOptional({ example: 1000, description: 'Maximum distance in yards/meters' })
  @IsNumber()
  @Min(1)
  @Max(2000)
  @IsOptional()
  maxDistance?: number;

  @ApiPropertyOptional({ example: 350, description: 'Altitude in meters above sea level' })
  @IsNumber()
  @IsOptional()
  altitude?: number;

  @ApiPropertyOptional({ example: '34.0522,-118.2437', description: 'Latitude and Longitude' })
  @IsString()
  @IsOptional()
  @Matches(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/, {
    message: 'gpsCoordinates must be a valid lat,lng string',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MaxLength(255)
  gpsCoordinates?: string;

  @ApiPropertyOptional({ example: 'NW', description: 'Typical wind direction' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  typicalWindDir?: string;

  @ApiPropertyOptional({ example: '.338 Lapua', description: 'Maximum allowed caliber' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  maxCaliber?: string;
}
