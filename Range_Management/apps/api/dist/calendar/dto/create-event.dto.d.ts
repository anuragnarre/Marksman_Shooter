export type EventType = 'SESSION' | 'TASK' | 'PLAN' | 'REMINDER' | 'COMPETITION';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
export declare class CreateEventDto {
    title: string;
    description?: string;
    eventType: EventType;
    start: string;
    end: string;
    allDay?: boolean;
    color?: string;
    assigneeIds?: string[];
    recurringType?: RecurringType;
    recurringUntil?: string;
}
