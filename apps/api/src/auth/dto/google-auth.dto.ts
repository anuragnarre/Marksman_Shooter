import { IsString, IsEmail, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  googleId!: string;
}
