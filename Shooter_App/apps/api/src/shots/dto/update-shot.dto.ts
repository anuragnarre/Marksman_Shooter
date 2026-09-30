import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateShotDto {
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
