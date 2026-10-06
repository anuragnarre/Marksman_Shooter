declare class CategoryDto {
    name: string;
    fee?: number;
    maxParticipants?: number;
}
export declare class CreateEventDto {
    name: string;
    description?: string;
    date: string;
    time: string;
    location: string;
    registrationFee?: number;
    rules?: string;
    guidelines?: string;
    images?: string[];
    videos?: string[];
    maxParticipants?: number;
    categories?: CategoryDto[];
}
export {};
