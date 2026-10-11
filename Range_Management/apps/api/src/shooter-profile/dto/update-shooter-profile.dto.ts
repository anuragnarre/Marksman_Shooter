import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateShooterProfileDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dominantHand?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  eyeDominance?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stance?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  heightCm?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;
}
