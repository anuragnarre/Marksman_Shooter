export declare class UpdateEventDto {
    name?: string;
    description?: string;
    date?: string;
    time?: string;
    location?: string;
    registrationFee?: number;
    rules?: string;
    guidelines?: string;
    images?: string[];
    videos?: string[];
    maxParticipants?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
}
