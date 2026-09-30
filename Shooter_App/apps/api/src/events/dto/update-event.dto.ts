import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationFee?: number;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  guidelines?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'] as const)
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
}
