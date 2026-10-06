"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WeatherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WeatherService = WeatherService_1 = class WeatherService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WeatherService_1.name);
        this.cache = new Map();
        this.CACHE_TTL_MS = 15 * 60 * 1000;
    }
    async getWeatherForRange(rangeId) {
        const cached = this.cache.get(rangeId);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        const range = await this.prisma.shootingRange.findUnique({
            where: { id: rangeId },
            select: { gpsCoordinates: true },
        });
        if (!range?.gpsCoordinates)
            return null;
        const [lat, lng] = range.gpsCoordinates.split(',').map((s) => s.trim());
        if (!lat || !lng)
            return null;
        try {
            const url = `https://api.open-meteo.com/v1/forecast` +
                `?latitude=${lat}&longitude=${lng}` +
                `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,visibility` +
                `&wind_speed_unit=kmh`;
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`OpenMeteo HTTP ${res.status}`);
            const json = (await res.json());
            const c = json.current;
            const data = {
                temperature: c.temperature_2m,
                humidity: c.relative_humidity_2m,
                windSpeed: c.wind_speed_10m,
                windDirection: c.wind_direction_10m,
                pressure: c.surface_pressure,
                visibility: c.visibility,
                fetchedAt: new Date(),
            };
            this.cache.set(rangeId, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
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
        }
        catch (err) {
            this.logger.warn(`Weather fetch failed for range ${rangeId}: ${err.message}`);
            return null;
        }
    }
    async getForecastForRange(rangeId) {
        const range = await this.prisma.shootingRange.findUnique({
            where: { id: rangeId },
            select: { gpsCoordinates: true },
        });
        if (!range?.gpsCoordinates)
            return null;
        const [lat, lng] = range.gpsCoordinates.split(',').map((s) => s.trim());
        if (!lat || !lng)
            return null;
        try {
            const url = `https://api.open-meteo.com/v1/forecast` +
                `?latitude=${lat}&longitude=${lng}` +
                `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant` +
                `&timezone=auto&forecast_days=7`;
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`OpenMeteo HTTP ${res.status}`);
            return await res.json();
        }
        catch (err) {
            this.logger.warn(`Forecast fetch failed for range ${rangeId}: ${err.message}`);
            return null;
        }
    }
    async getEnvironmentLog(rangeId, from, to) {
        const where = { rangeId };
        if (from || to) {
            where.recordedAt = {};
            if (from)
                where.recordedAt.gte = new Date(from);
            if (to)
                where.recordedAt.lte = new Date(to);
        }
        return this.prisma.environmentLog.findMany({
            where,
            orderBy: { recordedAt: 'asc' },
            take: 500,
        });
    }
    async getWindScoreCorrelation(rangeId) {
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
            const windMatch = s.sessionContext.windCondition?.match(/(\d+(\.\d+)?)/);
            const windSpeed = windMatch ? parseFloat(windMatch[1]) : null;
            return windSpeed != null ? { windSpeed, avgScore, sessionId: s.id, sessionDate: s.sessionDate } : null;
        })
            .filter(Boolean);
        return points;
    }
};
exports.WeatherService = WeatherService;
exports.WeatherService = WeatherService = WeatherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WeatherService);
//# sourceMappingURL=weather.service.js.map