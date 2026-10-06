export declare class HealthConnectReadingDto {
    timestamp: string;
    heartRate?: number;
    spo2?: number;
    respiratoryRate?: number;
    steps?: number;
    calories?: number;
    activeMinutes?: number;
}
export declare class HealthConnectSyncDto {
    readings: HealthConnectReadingDto[];
    sessionId?: string;
}
