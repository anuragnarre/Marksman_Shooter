import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import {   Type  } from 'class-transformer';

class CategoryDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;
}

export class CreateEventDto {
  @IsString()
  @MaxLength(300)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;

  @IsString()
  time!: string;

  @IsString()
  @MaxLength(500)
  location!: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories?: CategoryDto[];
}
