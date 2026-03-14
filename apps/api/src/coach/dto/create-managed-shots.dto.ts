import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ManagedShotEntryDto {
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

export class CreateManagedShotsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManagedShotEntryDto)
  shots!: ManagedShotEntryDto[];
}
