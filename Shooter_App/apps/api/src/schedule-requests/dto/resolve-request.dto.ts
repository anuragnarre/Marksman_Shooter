// apps/api/src/schedule-requests/dto/resolve-request.dto.ts
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export class ResolveRequestDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  coachNote?: string;

  /** If true and status=APPROVED, apply the shooter's suggested changes to the event */
  @IsOptional()
  @IsBoolean()
  applyChanges?: boolean;
}
