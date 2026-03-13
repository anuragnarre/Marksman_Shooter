// apps/api/src/coach/dto/invite-shooter.dto.ts
import { IsUUID } from 'class-validator';

export class InviteShooterDto {
  @IsUUID()
  shooterId!: string;
}
