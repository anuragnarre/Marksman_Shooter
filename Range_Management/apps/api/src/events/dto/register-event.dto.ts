import { IsOptional, IsString } from 'class-validator';

export class RegisterEventDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}
