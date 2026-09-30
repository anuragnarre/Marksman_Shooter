import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EquipmentType {
  RIFLE = 'RIFLE',
  PISTOL = 'PISTOL',
  SHOTGUN = 'SHOTGUN',
  CROSSBOW = 'CROSSBOW',
  OTHER = 'OTHER',
}

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Glock 19 Gen 5', description: 'Name of the equipment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ enum: EquipmentType, example: EquipmentType.PISTOL })
  @IsEnum(EquipmentType)
  @IsNotEmpty()
  type: EquipmentType;

  @ApiPropertyOptional({ example: 'BXYZ123', description: 'Serial number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  serialNumber?: string;

  @ApiPropertyOptional({ example: '9mm', description: 'Caliber or gauge' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  caliber?: string;

  @ApiPropertyOptional({ example: '2023-01-15T00:00:00.000Z', description: 'Purchase date' })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 'Used for IPSC matches', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
