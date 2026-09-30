// apps/api/src/coach/dto/create-connection.dto.ts
import { IsUUID } from 'class-validator';

export class CreateConnectionDto {
  @IsUUID()
  coachId!: string;
}
