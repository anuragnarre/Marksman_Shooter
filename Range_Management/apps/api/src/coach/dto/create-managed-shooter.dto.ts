import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateManagedShooterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  shooterCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryWeapon?: string;
}
