import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
    visibility: number;
  };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  fetchedAt: Date;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  // In-memory cache: rangeId → { data, expiresAt }
  private readonly cache = new Map<string, { data: WeatherData; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current weather for a range (cached 15 min).
   * Returns null if range has no GPS coordinates.
   */
  async getWeatherForRange(rangeId: string): Promise<WeatherData | null> {
    // Check in-memory cache first
    const cached = this.cache.get(rangeId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const range = await this.prisma.shootingRange.findUnique({
      where: { id: rangeId },
      select: { gpsCoordinates: true },
    });

    if (!range?.gpsCoordinates) return null;

    const [lat, lng] = range.gpsCoordinates.split(',').map((s) => s.trim());
    if (!lat || !lng) return null;

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,visibility` +
        `&wind_speed_unit=kmh`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenMeteo HTTP ${res.status}`);

      const json = (await res.json()) as OpenMeteoResponse;
      const c = json.current;

      const data: WeatherData = {
        temperature: c.temperature_2m,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        windDirection: c.wind_direction_10m,
        pressure: c.surface_pressure,
        visibility: c.visibility,
        fetchedAt: new Date(),
      };

      // Store in cache
      this.cache.set(rangeId, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });

      // Persist to EnvironmentLog for historical querying
      await this.prisma.environmentLog.create({
        data: {
          rangeId,
          temperature: data.temperature,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          pressure: data.pressure,
          visibility: data.visibility,
        },
      });

      return data;
    } catch (err) {
      this.logger.warn(`Weather fetch failed for range ${rangeId}: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Get weather forecast (7-day) for a range.
   */
  async getForecastForRange(rangeId: string): Promise<object | null> {
    const range = await this.prisma.shootingRange.findUnique({
      where: { id: rangeId },
      select: { gpsCoordinates: true },
    });

    if (!range?.gpsCoordinates) return null;

    const [lat, lng] = range.gpsCoordinates.split(',').map((s) => s.trim());
    if (!lat || !lng) return null;

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lng}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant` +
        `&timezone=auto&forecast_days=7`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenMeteo HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      this.logger.warn(`Forecast fetch failed for range ${rangeId}: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Get historical environment logs for a range in a date range.
   */
  async getEnvironmentLog(rangeId: string, from?: string, to?: string) {
    const where: any = { rangeId };
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from);
      if (to) where.recordedAt.lte = new Date(to);
    }

    return this.prisma.environmentLog.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
      take: 500, // cap for large date ranges
    });
  }

  /**
   * Wind-score correlation: scatter chart data per session at a range.
   */
  async getWindScoreCorrelation(rangeId: string) {
    // Find all sessions at the range that have a session context with wind info
    const sessions = await this.prisma.session.findMany({
      where: { rangeId, deletedAt: null },
      include: {
        sessionContext: true,
        shots: { select: { score: true } },
      },
    });

    const points = sessions
      .filter((s) => s.sessionContext?.windCondition != null && s.shots.length > 0)
      .map((s) => {
        const avgScore = s.shots.reduce((sum, sh) => sum + sh.score, 0) / s.shots.length;
        // windCondition is stored as a string like "15 km/h NW" — extract numeric part
        const windMatch = s.sessionContext!.windCondition?.match(/(\d+(\.\d+)?)/);
        const windSpeed = windMatch ? parseFloat(windMatch[1]) : null;
        return windSpeed != null ? { windSpeed, avgScore, sessionId: s.id, sessionDate: s.sessionDate } : null;
      })
      .filter(Boolean);

    return points;
  }
}
