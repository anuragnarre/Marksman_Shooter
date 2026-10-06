import { NotificationType } from '@prisma/client';
export declare class UpdatePreferenceDto {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
    smsEnabled?: boolean;
    disabledTypes?: NotificationType[];
}
