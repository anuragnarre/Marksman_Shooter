import { IsUUID } from 'class-validator';

export class JoinWaitlistDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  slotId: string; // The ID of the TimeSlot the user is waiting for
}
