// apps/api/src/shots/dto/manual-shots.dto.ts
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShotEntryDto {
  @IsInt()
  @Min(1)
  shotNumber!: number;

  @IsNumber()
  @Min(0)
  @Max(10.9)
  score!: number;

  @IsOptional()
  @IsNumber()
  @Min(-15)
  @Max(15)
  x?: number;

  @IsOptional()
  @IsNumber()
  @Min(-15)
  @Max(15)
  y?: number;
}

export class ManualShotsDto {
  @IsUUID()
  sessionId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShotEntryDto)
  shots!: ShotEntryDto[];
}
