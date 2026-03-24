import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  credential!: string; // Google ID token returned by the Sign-In Library

  @IsOptional()
  @IsIn(['SHOOTER', 'COACH'])
  role?: 'SHOOTER' | 'COACH';
}
