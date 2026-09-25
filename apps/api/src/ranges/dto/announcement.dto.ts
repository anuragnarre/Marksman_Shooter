import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Range Closed Sunday 29th' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  title: string;

  @ApiProperty({ example: 'The range will be closed for maintenance on Sunday 29th September.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  body: string;

  @ApiPropertyOptional({ enum: ['GENERAL', 'CLOSURE', 'MAINTENANCE', 'SPECIAL_EVENT'] })
  @IsEnum(['GENERAL', 'CLOSURE', 'MAINTENANCE', 'SPECIAL_EVENT'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: '2026-09-29T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-09-29T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  endsAt?: string;
}
