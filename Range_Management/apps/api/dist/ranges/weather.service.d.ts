import { PrismaService } from '../prisma/prisma.service';
export interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    fetchedAt: Date;
}
export declare class WeatherService {
    private readonly prisma;
    private readonly logger;
    private readonly cache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    getWeatherForRange(rangeId: string): Promise<WeatherData | null>;
    getForecastForRange(rangeId: string): Promise<object | null>;
    getEnvironmentLog(rangeId: string, from?: string, to?: string): Promise<{
        id: string;
        rangeId: string;
        temperature: number | null;
        humidity: number | null;
        windSpeed: number | null;
        windDirection: number | null;
        pressure: number | null;
        visibility: number | null;
        recordedAt: Date;
    }[]>;
    getWindScoreCorrelation(rangeId: string): Promise<({
        windSpeed: number;
        avgScore: number;
        sessionId: string;
        sessionDate: Date;
    } | null)[]>;
}
