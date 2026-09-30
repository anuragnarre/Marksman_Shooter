// apps/api/src/shots/dto/import-shots.dto.ts
import { IsUUID } from 'class-validator';

export class ImportShotsDto {
  @IsUUID()
  sessionId!: string;
}
