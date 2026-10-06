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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const genai_1 = require("@google/genai");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const analytics_service_1 = require("../analytics/analytics.service");
const MODEL = 'gemini-2.0-flash';
let PerformanceService = class PerformanceService {
    constructor(prisma, analytics, config) {
        this.prisma = prisma;
        this.analytics = analytics;
        this.config = config;
        this.ai = null;
        const envKey = this.config.get('GEMINI_API_KEY');
        const apiKey = envKey || '';
        this.ai = new genai_1.GoogleGenAI({ apiKey });
    }
    async getDeepAnalysis(userId, sessionId, role = 'SHOOTER', shooterIdHint) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, deletedAt: null },
            include: { shots: { orderBy: { shotNumber: 'asc' } } },
        });
        if (!session)
            throw new common_1.NotFoundException(`Session ${sessionId} not found`);
        if (shooterIdHint && shooterIdHint !== session.shooterId) {
            throw new common_1.ForbiddenException('Session does not belong to the requested shooter');
        }
        await this.assertActorCanAccessShooter(userId, role, session.shooterId);
        const shots = session.shots;
        if (shots.length === 0) {
            return {
                sessionId,
                fatigueIndex: 0,
                focusScore: 50,
                outlierShots: [],
                clusterCount: 1,
                warmupShots: 0,
                peakSeriesIndex: 0,
                peakSeriesAvg: 0,
            };
        }
        const analyticsResult = await this.analytics.computeForSession(sessionId);
        const { seriesAverages, averageScore, stdDev } = analyticsResult;
        const fatigueIndex = this.computeSlope(seriesAverages);
        const scores = shots.map((s) => s.score);
        const shotNums = shots.map((_, i) => i + 1);
        const spearman = this.spearmanCorrelation(shotNums, scores);
        const focusScore = Math.round(Math.max(0, Math.min(100, (spearman + 1) * 50)));
        const threshold = averageScore - 2 * stdDev;
        const outlierShots = shots
            .filter((s) => s.score < threshold)
            .map((s) => s.shotNumber);
        const points = shots.map((s) => [s.x, s.y]);
        const clusterCount = this.estimateClusters(points);
        const warmupShots = this.findWarmupEnd(scores, averageScore);
        const peakSeriesIndex = seriesAverages.length > 0
            ? seriesAverages.indexOf(Math.max(...seriesAverages))
            : 0;
        const peakSeriesAvg = seriesAverages[peakSeriesIndex] ?? 0;
        return {
            sessionId,
            fatigueIndex: Math.round(fatigueIndex * 1000) / 1000,
            focusScore,
            outlierShots,
            clusterCount,
            warmupShots,
            peakSeriesIndex,
            peakSeriesAvg: Math.round(peakSeriesAvg * 100) / 100,
        };
    }
    async saveSessionContext(userId, sessionId, dto, role = 'SHOOTER', shooterIdHint) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, deletedAt: null },
            select: { shooterId: true },
        });
        if (!session)
            throw new common_1.NotFoundException(`Session ${sessionId} not found`);
        if (shooterIdHint && shooterIdHint !== session.shooterId) {
            throw new common_1.ForbiddenException('Session does not belong to the requested shooter');
        }
        await this.assertActorCanAccessShooter(userId, role, session.shooterId);
        return this.prisma.sessionContext.upsert({
            where: { sessionId },
            create: { sessionId, ...dto },
            update: { ...dto },
        });
    }
    async generateTrainingPlan(userId, role = 'SHOOTER', shooterId) {
        const targetShooterId = await this.resolveShooterId(userId, role, shooterId);
        const sessions = await this.prisma.session.findMany({
            where: { shooterId: targetShooterId, deletedAt: null },
            include: { shots: { orderBy: { shotNumber: 'asc' } } },
            orderBy: { sessionDate: 'desc' },
            take: 10,
        });
        if (sessions.length === 0) {
            throw new common_1.ForbiddenException('No sessions found to generate a plan from');
        }
        const analyses = [];
        for (const s of sessions) {
            try {
                const da = await this.getDeepAnalysis(userId, s.id, role, targetShooterId);
                analyses.push(da);
            }
            catch {
            }
        }
        const avgFatigue = analyses.length
            ? analyses.reduce((a, b) => a + b.fatigueIndex, 0) / analyses.length
            : 0;
        const avgFocus = analyses.length
            ? analyses.reduce((a, b) => a + b.focusScore, 0) / analyses.length
            : 50;
        const avgOutlierRate = analyses.length
            ? analyses.reduce((a, b) => a + b.outlierShots.length, 0) / analyses.length
            : 0;
        const avgCluster = analyses.length
            ? analyses.reduce((a, b) => a + b.clusterCount, 0) / analyses.length
            : 1;
        const disciplineCount = new Map();
        sessions.forEach((s) => disciplineCount.set(s.discipline, (disciplineCount.get(s.discipline) ?? 0) + 1));
        const topDiscipline = [...disciplineCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'General';
        const allScores = sessions.flatMap((s) => s.shots.map((sh) => sh.score));
        const overallAvg = allScores.length
            ? allScores.reduce((a, b) => a + b, 0) / allScores.length
            : 0;
        const prompt = `You are an elite shooting coach. Based on the shooter's recent performance data, generate a personalised 4-week training plan.

SHOOTER DATA (last ${sessions.length} sessions):
- Primary discipline: ${topDiscipline}
- Overall average score: ${overallAvg.toFixed(2)}
- Average focus score: ${avgFocus.toFixed(0)}/100
- Average fatigue index: ${avgFatigue.toFixed(3)} (negative = fatiguing over session, positive = improving)
- Average outlier shots per session: ${avgOutlierRate.toFixed(1)} (shots >2 SD below mean)
- Average cluster count: ${avgCluster.toFixed(1)} (1=tight group, 3+=scattered)

IDENTIFIED WEAKNESSES:
${avgFatigue < -0.05 ? '- Endurance/fatigue: score drops significantly over session' : ''}
${avgFocus < 50 ? '- Mental focus: poor correlation between shot number and score' : ''}
${avgOutlierRate > 2 ? '- Consistency: frequent outlier shots indicating technique breakdown' : ''}
${avgCluster > 2 ? '- Grouping: scattered shot placement indicating stance/hold issues' : ''}
${overallAvg < 8 ? '- Base score: overall average below competitive threshold' : ''}

Generate a 4-week progressive training plan. Return ONLY a valid JSON object in this exact format:
{
  "coachingNote": "<2-3 sentence personalised guidance paragraph>",
  "focusAreas": ["<area1>", "<area2>", "<area3>"],
  "weeks": [
    {
      "week": 1,
      "focus": "<week theme>",
      "sessions": [
        {
          "day": "Monday",
          "drill": "<drill name>",
          "sets": <number>,
          "shots": <number>,
          "restMinutes": <number>,
          "notes": "<specific technique cue>"
        }
      ]
    }
  ]
}

Each week should have 3-4 training sessions. Progress from foundational to advanced across the 4 weeks.`;
        let planContent;
        if (!this.ai) {
            throw new common_1.InternalServerErrorException('AI Training Plans require a GEMINI_API_KEY.');
        }
        try {
            const response = await this.ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    systemInstruction: 'You are an elite shooting coach. Return only valid JSON.',
                    temperature: 0.4,
                },
            });
            const raw = response.text ?? '{}';
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            planContent = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        }
        catch {
            throw new common_1.InternalServerErrorException('Failed to generate training plan');
        }
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const saved = await this.prisma.trainingPlan.create({
            data: {
                userId: targetShooterId,
                content: planContent,
                weekStart,
                focusAreas: planContent.focusAreas ?? [],
            },
        });
        return this.formatPlan(saved);
    }
    async getTrainingPlans(userId, role = 'SHOOTER', shooterId) {
        const targetShooterId = await this.resolveShooterId(userId, role, shooterId);
        const plans = await this.prisma.trainingPlan.findMany({
            where: { userId: targetShooterId },
            orderBy: { generatedAt: 'desc' },
        });
        return plans.map((p) => this.formatPlan(p));
    }
    async resolveShooterId(actorId, role, shooterId) {
        if (role === 'COACH') {
            if (!shooterId)
                throw new common_1.ForbiddenException('shooterId is required for coach access');
            await this.assertCoachCanAccessShooter(actorId, shooterId);
            return shooterId;
        }
        return actorId;
    }
    async assertActorCanAccessShooter(actorId, role, shooterId) {
        if (role === 'COACH') {
            await this.assertCoachCanAccessShooter(actorId, shooterId);
            return;
        }
        if (actorId !== shooterId)
            throw new common_1.ForbiddenException('Access denied');
    }
    async assertCoachCanAccessShooter(coachId, shooterId) {
        const [connection, managedProfile] = await Promise.all([
            this.prisma.coachConnection.findFirst({
                where: { coachId, shooterId, status: 'APPROVED' },
                select: { id: true },
            }),
            this.prisma.shooterProfile.findFirst({
                where: { userId: shooterId, managedByCoachId: coachId, isManaged: true },
                select: { id: true },
            }),
        ]);
        if (!connection && !managedProfile) {
            throw new common_1.ForbiddenException('No approved coaching relationship with this shooter');
        }
    }
    formatPlan(plan) {
        const content = plan.content;
        return {
            id: plan.id,
            generatedAt: plan.generatedAt.toISOString(),
            weekStart: plan.weekStart.toISOString().slice(0, 10),
            focusAreas: plan.focusAreas,
            weeks: content.weeks ?? [],
            coachingNote: content.coachingNote ?? '',
        };
    }
    computeSlope(values) {
        if (values.length < 2)
            return 0;
        const n = values.length;
        const xs = values.map((_, i) => i);
        const meanX = xs.reduce((a, b) => a + b, 0) / n;
        const meanY = values.reduce((a, b) => a + b, 0) / n;
        const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0);
        const den = xs.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
        return den === 0 ? 0 : num / den;
    }
    spearmanCorrelation(xs, ys) {
        const n = xs.length;
        if (n < 2)
            return 0;
        const rankX = this.ranks(xs);
        const rankY = this.ranks(ys);
        const dSquaredSum = rankX.reduce((sum, rx, i) => sum + Math.pow(rx - rankY[i], 2), 0);
        return 1 - (6 * dSquaredSum) / (n * (n * n - 1));
    }
    ranks(arr) {
        const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
        const ranks = new Array(arr.length);
        sorted.forEach(({ i }, rank) => (ranks[i] = rank + 1));
        return ranks;
    }
    estimateClusters(points) {
        if (points.length < 3)
            return 1;
        const inertias = [];
        for (let k = 1; k <= 3; k++) {
            inertias.push(this.kMeansInertia(points, k));
        }
        if (inertias[0] > 0 && inertias[1] / inertias[0] < 0.6) {
            if (inertias[1] > 0 && inertias[2] / inertias[1] < 0.6)
                return 3;
            return 2;
        }
        return 1;
    }
    kMeansInertia(points, k) {
        let centroids = points.slice(0, k).map((p) => [...p]);
        for (let iter = 0; iter < 5; iter++) {
            const clusters = Array.from({ length: k }, () => []);
            for (const p of points) {
                let best = 0;
                let bestDist = Infinity;
                for (let c = 0; c < k; c++) {
                    const d = Math.pow(p[0] - centroids[c][0], 2) + Math.pow(p[1] - centroids[c][1], 2);
                    if (d < bestDist) {
                        bestDist = d;
                        best = c;
                    }
                }
                clusters[best].push(p);
            }
            centroids = clusters.map((cl) => cl.length
                ? [cl.reduce((a, p) => a + p[0], 0) / cl.length, cl.reduce((a, p) => a + p[1], 0) / cl.length]
                : centroids[0]);
        }
        return points.reduce((sum, p) => {
            const dists = centroids.map((c) => Math.pow(p[0] - c[0], 2) + Math.pow(p[1] - c[1], 2));
            return sum + Math.min(...dists);
        }, 0);
    }
    findWarmupEnd(scores, mean) {
        const windowSize = 5;
        for (let i = windowSize - 1; i < scores.length; i++) {
            const windowAvg = scores.slice(i - windowSize + 1, i + 1).reduce((a, b) => a + b, 0) / windowSize;
            if (windowAvg >= mean)
                return i - windowSize + 1;
        }
        return 0;
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        analytics_service_1.AnalyticsService,
        config_1.ConfigService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map