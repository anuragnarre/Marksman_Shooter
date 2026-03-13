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

export class CreateSessionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  discipline!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  distance!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  weaponType!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  numberOfShots!: number;

  @IsDateString()
  sessionDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trainingMode?: string;
}
