import type { EventType } from './create-event.dto';
export declare class UpdateEventDto {
    title?: string;
    description?: string;
    eventType?: EventType;
    start?: string;
    end?: string;
    allDay?: boolean;
    color?: string;
    assigneeIds?: string[];
}
