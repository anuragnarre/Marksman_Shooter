// apps/api/src/auth/dto/register.dto.ts
import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@shooting-platform/shared-types';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsEnum(['SHOOTER', 'COACH'] as const)
  role!: UserRole;
}
