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
import type { AiBiometricAnalysis } from '@shooting-platform/shared-types';

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
  private readonly groq: Groq;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly biometricsService: BiometricsService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    this.groq = new Groq({ apiKey });
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
}
