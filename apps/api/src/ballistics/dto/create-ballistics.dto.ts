import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, ValidateNested, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AtmosphericConditionsDto {
  @ApiPropertyOptional({ example: 70, description: 'Temperature in Fahrenheit' })
  @IsNumber()
  @IsOptional()
  temp?: number;

  @ApiPropertyOptional({ example: 50, description: 'Humidity percentage' })
  @IsNumber()
  @IsOptional()
  humidity?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Altitude in feet' })
  @IsNumber()
  @IsOptional()
  altitude?: number;

  @ApiPropertyOptional({ example: 5, description: 'Wind speed in mph' })
  @IsNumber()
  @IsOptional()
  windSpeedMph?: number;

  @ApiPropertyOptional({ example: 90, description: 'Wind angle in degrees' })
  @IsNumber()
  @IsOptional()
  windAngleDeg?: number;
}

export class CreateBallisticsDto {
  @ApiProperty({ example: 'Rifle', description: 'Type of the weapon' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  weaponType: string;

  @ApiProperty({ example: '.308 Win', description: 'Caliber of the weapon' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  caliber: string;

  @ApiProperty({ example: 168, description: 'Weight of the bullet in grains' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  bulletWeightGrains: number;

  @ApiProperty({ example: 2600, description: 'Muzzle velocity in fps' })
  @IsNumber()
  @Min(100)
  @Max(5000)
  muzzleVelocityFps: number;

  @ApiProperty({ example: 0.45, description: 'Ballistic coefficient' })
  @IsNumber()
  ballisticCoefficient: number;

  @ApiProperty({ example: 100, description: 'Zero distance in yards' })
  @IsNumber()
  zeroDistanceYards: number;

  @ApiPropertyOptional({ type: () => AtmosphericConditionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AtmosphericConditionsDto)
  atmosphericConditions?: AtmosphericConditionsDto;
}
