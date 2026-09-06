// apps/api/src/biometrics/biometrics-ai.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import Groq from 'groq-sdk';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { BiometricsService } from './biometrics.service';
import type { AiBiometricAnalysis, AdvancedBiometricInsights } from '@shooting-platform/shared-types';

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an elite sports physiologist specialising in precision shooting disciplines.
You analyse biometric data (heart rate, SpO2, respiratory rate) alongside shot performance data to
identify physiological-performance correlations.

KNOWLEDGE BASE
━━━━━━━━━━━━━
- Optimal resting HR for precision shooting: 60-80 bpm
- Shot release should coincide with natural respiratory pause (exhale hold)
- HR > 100 bpm significantly degrades fine motor control and sight stability
- SpO2 < 95% indicates potential fatigue or altitude effects
- Heart Rate Variability (HRV): higher = better parasympathetic tone = calmer shooter
- Fatigue pattern: HR drift upward + declining scores in later series
- Optimal performance window: stable HR 60-80 bpm + SpO2 > 96% + controlled breathing
- Breathing rate 12-20/min normal; shooters should aim for slow 6-10/min during aiming

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "summary": "<2-3 sentences on biometric-performance relationship>",
  "performanceCorrelation": "<specific correlation between HR/SpO2 and shot scores>",
  "insights": [
    {
      "category": "<heart_rate|breathing|fatigue|optimal_window|correlation|general>",
      "severity": "<critical|moderate|positive>",
      "title": "<max 6 words>",
      "observation": "<data-backed observation>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "optimalWindows": [
    { "startIndex": <shot number>, "endIndex": <shot number>, "avgHr": <number>, "avgScore": <number> }
  ]
}
Provide 3-6 insights. Reference specific numbers from the data.`;

@Injectable()
export class BiometricsAiService {
  private groq: Groq | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly biometricsService: BiometricsService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const isValidKey = apiKey && !['dummy', 'placeholder', 'your-groq-api-key'].some(p => apiKey.startsWith(p));
    if (!isValidKey) {
      console.warn('[BiometricsAiService] GROQ_API_KEY not configured — AI biometric insights will be unavailable');
    } else {
      this.groq = new Groq({ apiKey });
    }
  }

  async analyzeSessionBiometrics(
    sessionId: string,
    userId: string,
  ): Promise<AiBiometricAnalysis> {
    // Load session + shots
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: { shots: { orderBy: { shotNumber: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.shooterId !== userId) {
      throw new ForbiddenException('Cannot access this session');
    }

    // Load biometric readings for this session
    const readings = await this.prisma.biometricReading.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    if (readings.length === 0) {
      throw new ForbiddenException('No biometric readings for this session');
    }

    const summary = await this.biometricsService.getSessionSummary(sessionId, userId);
    const analytics = await this.analyticsService.computeForSession(sessionId);

    // Build time-aligned data
    const shotData = session.shots.slice(0, 60).map(s => ({
      n: s.shotNumber,
      score: s.score,
      time: new Date(s.timestamp).toISOString(),
    }));

    const bioData = readings.slice(0, 100).map(r => ({
      hr: r.heartRate,
      spo2: r.spo2,
      rr: r.respiratoryRate,
      time: new Date(r.timestamp).toISOString(),
      type: r.readingType,
    }));

    const userPrompt = `SESSION BIOMETRIC ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━
Discipline: ${session.discipline} | Distance: ${session.distance}m | Weapon: ${session.weaponType}
Total shots: ${session.shots.length} | Avg score: ${analytics.averageScore}

BIOMETRIC SUMMARY
━━━━━━━━━━━━━━━━
Avg HR: ${summary.avgHeartRate} bpm (range: ${summary.minHeartRate}-${summary.maxHeartRate})
HRV (std dev): ${summary.hrv}
Avg SpO2: ${summary.avgSpo2}%
${summary.avgRespiratoryRate ? `Avg Respiratory Rate: ${summary.avgRespiratoryRate} breaths/min` : ''}
Total readings: ${summary.readingCount}

SHOT DATA (time-stamped)
━━━━━━━━━━━━━━━━━━━━━━━━
${shotData.map(s => `#${s.n}: score=${s.score} at ${s.time}`).join('\n')}

BIOMETRIC READINGS (time-stamped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bioData.map(r => `HR=${r.hr ?? '-'} SpO2=${r.spo2 ?? '-'}% RR=${r.rr ?? '-'} [${r.type}] at ${r.time}`).join('\n')}

Analyse the biometric-performance correlation and provide insights in the required JSON format.`;

    if (!this.groq) {
      throw new InternalServerErrorException(
        'AI biometric analysis is not configured. Add a GROQ_API_KEY to enable it.',
      );
    }
    let raw: string;
    try {
      const completion = await this.groq.chat.completions.create({
        model: MODEL,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Biometric Analysis unavailable: ${(err as Error).message}`,
      );
    }

    let parsed: any;
    try {
      const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(json);
    } catch {
      throw new InternalServerErrorException('AI returned an invalid response — please retry');
    }

    return {
      sessionId,
      summary: parsed.summary ?? '',
      performanceCorrelation: parsed.performanceCorrelation ?? '',
      insights: parsed.insights ?? [],
      optimalWindows: parsed.optimalWindows ?? [],
      generatedAt: new Date().toISOString(),
      model: MODEL,
    };
  }

  // ── Advanced Holistic Insights (across all recent data) ──────────────────

  async generateAdvancedInsights(
    userId: string,
    days: number = 30,
  ): Promise<AdvancedBiometricInsights> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch all recent biometric readings
    const readings = await this.prisma.biometricReading.findMany({
      where: { userId, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
      take: 500,
    });

    if (readings.length < 3) {
      // Return a graceful empty state instead of throwing — new users have no data yet
      return {
        breathing: { estimatedRate: null, pattern: 'No data yet', consistencyScore: 0, recommendations: ['Connect a biometric device or sync Health Connect to get started.'] },
        hrStability: { restingHr: 0, activeHr: 0, recoveryRate: 'No data', calmnessScore: 0, zoneBreakdown: { optimal: 0, elevated: 0, high: 0 }, recommendations: [] },
        focusStress: { stressLevel: 'moderate', hrvTrend: 'No data', mentalReadiness: 0, recommendations: [] },
        performanceOptimization: { optimalHrZone: '60-80 bpm', bestPerformanceWindow: 'No data', shotTimingCorrelation: 'No data', recommendations: [] },
        insights: [],
        overallReadiness: 0,
        overallReadinessLabel: 'No Data',
        dataSource: 'none',
        generatedAt: new Date().toISOString(),
        model: MODEL,
      } as any;
    }

    // Fetch recent sessions with shots
    const sessions = await this.prisma.session.findMany({
      where: { shooterId: userId, deletedAt: null, createdAt: { gte: since } },
      include: { shots: { orderBy: { shotNumber: 'asc' }, take: 60 } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Detect data source
    const hasCustomSensor = readings.some(r => r.readingType !== 'health_connect_sync');
    const hasHealthConnect = readings.some(r => r.readingType === 'health_connect_sync');
    const dataSource = hasCustomSensor && hasHealthConnect ? 'combined' : hasHealthConnect ? 'health_connect' : 'sensor';

    // Compute stats
    const hrs = readings.map(r => r.heartRate).filter((v): v is number => v !== null);
    const spo2s = readings.map(r => r.spo2).filter((v): v is number => v !== null);
    const rrs = readings.map(r => r.respiratoryRate).filter((v): v is number => v !== null);

    const avgHr = hrs.length > 0 ? hrs.reduce((a, b) => a + b, 0) / hrs.length : 0;
    const minHr = hrs.length > 0 ? Math.min(...hrs) : 0;
    const maxHr = hrs.length > 0 ? Math.max(...hrs) : 0;
    const hrStdDev = hrs.length > 1
      ? Math.sqrt(hrs.reduce((s, v) => s + (v - avgHr) ** 2, 0) / (hrs.length - 1))
      : 0;
    const avgSpo2 = spo2s.length > 0 ? spo2s.reduce((a, b) => a + b, 0) / spo2s.length : 0;
    const avgRr = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : null;

    // Zone breakdown
    const optimal = hrs.filter(h => h >= 60 && h <= 80).length;
    const elevated = hrs.filter(h => h > 80 && h <= 100).length;
    const high = hrs.filter(h => h > 100).length;
    const total = hrs.length || 1;

    // Session performance summary
    const sessionSummaries = sessions.map(s => {
      const scores = s.shots.map(sh => sh.score);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return {
        date: new Date(s.sessionDate).toISOString().slice(0, 10),
        discipline: s.discipline,
        shotCount: s.shots.length,
        avgScore: Math.round(avg * 100) / 100,
      };
    });

    // HR trend (first half vs second half)
    const halfIdx = Math.floor(hrs.length / 2);
    const firstHalfAvg = hrs.slice(0, halfIdx).reduce((a, b) => a + b, 0) / (halfIdx || 1);
    const secondHalfAvg = hrs.slice(halfIdx).reduce((a, b) => a + b, 0) / ((hrs.length - halfIdx) || 1);
    const hrTrend = secondHalfAvg > firstHalfAvg + 3 ? 'rising' : secondHalfAvg < firstHalfAvg - 3 ? 'falling' : 'stable';

    const ADVANCED_SYSTEM_PROMPT = `You are an elite sports physiologist and performance psychologist specialising in precision shooting.
You analyse biometric data to generate ADVANCED, PERSONALIZED insights across four domains:

1. BREATHING PATTERNS & RESPIRATION CONTROL
   - Analyse respiratory rate patterns (ideal for shooting: 6-10 breaths/min during aiming)
   - Detect breathing inconsistencies that affect shot stability
   - Recommend specific breathing techniques (box breathing, 4-7-8, natural respiratory pause)

2. HEART RATE STABILIZATION & CALMNESS
   - Evaluate HR zones: Optimal (60-80 bpm), Elevated (80-100), High (100+)
   - Assess HR variability (HRV) as indicator of parasympathetic tone
   - Identify pre-shot HR patterns and recovery between shots
   - Recommend HR control techniques (biofeedback, progressive relaxation)

3. FOCUS IMPROVEMENT & STRESS MANAGEMENT
   - Infer stress level from HRV and HR variability patterns
   - Detect anxiety signatures (sudden HR spikes, reduced HRV)
   - Assess mental readiness from physiological baseline
   - Recommend visualization, mindfulness, and arousal control strategies

4. PERFORMANCE OPTIMIZATION
   - Correlate biometric state with shot accuracy across sessions
   - Identify optimal physiological windows for peak performance
   - Detect fatigue patterns (HR drift, SpO2 decline over session)
   - Recommend warm-up protocols, session timing, recovery strategies

${dataSource === 'health_connect' || dataSource === 'combined' ? `
5. HEALTH CONNECT INSIGHTS (wearable data from daily life)
   - Analyse resting HR trends for cardiovascular fitness
   - Track recovery quality between training sessions
   - Correlate daily activity levels with session performance
   - Monitor sleep-adjacent HR patterns affecting readiness
` : ''}

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "breathing": {
    "estimatedRate": <number or null>,
    "pattern": "<description of breathing pattern observed>",
    "consistencyScore": <0-100>,
    "recommendations": ["<specific actionable recommendation>", ...]
  },
  "hrStability": {
    "restingHr": <number>,
    "activeHr": <number>,
    "recoveryRate": "<description>",
    "calmnessScore": <0-100>,
    "zoneBreakdown": { "optimal": <percent>, "elevated": <percent>, "high": <percent> },
    "recommendations": ["<specific recommendation>", ...]
  },
  "focusStress": {
    "stressLevel": "<low|moderate|high>",
    "hrvTrend": "<description of HRV trend>",
    "mentalReadiness": <0-100>,
    "recommendations": ["<specific recommendation>", ...]
  },
  "performanceOptimization": {
    "optimalHrZone": "<e.g. 65-75 bpm>",
    "bestPerformanceWindow": "<when in session user performs best>",
    "shotTimingCorrelation": "<how HR timing relates to shot quality>",
    "recommendations": ["<specific recommendation>", ...]
  },
  "insights": [
    {
      "domain": "<breathing|heart_rate_stability|focus_stress|performance_optimization|recovery|health_connect>",
      "severity": "<critical|moderate|positive>",
      "title": "<max 8 words>",
      "observation": "<data-backed observation with specific numbers>",
      "recommendation": "<actionable, specific recommendation>",
      "metric": "<metric name if applicable>",
      "metricValue": "<value with unit>",
      "trend": "<improving|declining|stable>"
    }
  ],
  "overallReadiness": <0-100>,
  "overallReadinessLabel": "<e.g. 'Peak Ready', 'Good Form', 'Needs Recovery', 'Elevated Stress'>"
}
Provide 6-10 insights spanning all domains. Use specific numbers from the data. Be actionable and specific to shooting sports.`;

    const userPrompt = `ADVANCED BIOMETRIC ANALYSIS REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analysis period: Last ${days} days
Data source: ${dataSource}
Total readings: ${readings.length}

BIOMETRIC OVERVIEW
━━━━━━━━━━━━━━━━━
Average HR: ${avgHr.toFixed(1)} bpm (range: ${minHr}-${maxHr})
HR Std Dev (HRV proxy): ${hrStdDev.toFixed(1)}
HR Trend over period: ${hrTrend}
Average SpO2: ${avgSpo2.toFixed(1)}%
${avgRr !== null ? `Average Respiratory Rate: ${avgRr.toFixed(1)} breaths/min` : 'Respiratory Rate: not available'}
Total HR readings: ${hrs.length}

HR ZONE BREAKDOWN
━━━━━━━━━━━━━━━━
Optimal (60-80 bpm): ${((optimal / total) * 100).toFixed(1)}%
Elevated (80-100 bpm): ${((elevated / total) * 100).toFixed(1)}%
High (>100 bpm): ${((high / total) * 100).toFixed(1)}%

RECENT SESSION PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━
${sessionSummaries.length > 0
  ? sessionSummaries.map(s => `${s.date}: ${s.discipline} | ${s.shotCount} shots | avg ${s.avgScore}`).join('\n')
  : 'No recent sessions with shots'}

READING SAMPLES (${Math.min(readings.length, 50)} of ${readings.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${readings.slice(0, 50).map(r =>
  `HR=${r.heartRate ?? '-'} SpO2=${r.spo2 ?? '-'}% RR=${r.respiratoryRate ?? '-'} [${r.readingType}] ${new Date(r.timestamp).toISOString()}`
).join('\n')}

Generate comprehensive advanced insights across all four domains. Reference specific numbers. Be actionable and specific to precision shooting.`;

    if (!this.groq) {
      throw new InternalServerErrorException(
        'AI advanced insights are not configured. Add a GROQ_API_KEY to enable them.',
      );
    }
    let raw: string;
    try {
      const completion = await this.groq.chat.completions.create({
        model: MODEL,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: ADVANCED_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Advanced Analysis unavailable: ${(err as Error).message}`,
      );
    }

    let parsed: any;
    try {
      const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(json);
    } catch {
      throw new InternalServerErrorException('AI returned an invalid response — please retry');
    }

    return {
      breathing: parsed.breathing ?? { estimatedRate: null, pattern: 'Unknown', consistencyScore: 0, recommendations: [] },
      hrStability: parsed.hrStability ?? {
        restingHr: Math.round(avgHr), activeHr: maxHr, recoveryRate: 'Unknown',
        calmnessScore: 0, zoneBreakdown: { optimal: 0, elevated: 0, high: 0 }, recommendations: [],
      },
      focusStress: parsed.focusStress ?? { stressLevel: 'moderate', hrvTrend: 'Unknown', mentalReadiness: 0, recommendations: [] },
      performanceOptimization: parsed.performanceOptimization ?? {
        optimalHrZone: '60-80 bpm', bestPerformanceWindow: 'Unknown',
        shotTimingCorrelation: 'Unknown', recommendations: [],
      },
      insights: parsed.insights ?? [],
      overallReadiness: parsed.overallReadiness ?? 50,
      overallReadinessLabel: parsed.overallReadinessLabel ?? 'Analyzing',
      dataSource,
      generatedAt: new Date().toISOString(),
      model: MODEL,
    };
  }
}
