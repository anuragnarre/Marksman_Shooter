// apps/api/src/ai-coach/ai-coach.service.ts
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
import { AiCoachAnalysis, AiCoachFinding, AiPerformanceAssistant, UserRole } from '@shooting-platform/shared-types';

// Free model — Llama 3.3 70B via Groq: 14,400 req/day, no billing required
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an elite shooting coach with 20+ years of experience in Olympic
Air Rifle, .22 LR Smallbore, and ISSF disciplines. You analyse session data and produce
technically precise, actionable coaching feedback grounded in biomechanics and sport science.

TECHNICAL KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━

Positioning (Standing, Air Rifle)
• Weight transfers through bones: left hand → forearm → elbow on iliac crest → pelvis → thigh → foot
• Upper body leans back to balance rifle weight over support area
• Left arm relaxed — muscles must NOT push barrel toward target
• Find zero point by closing eyes 30 seconds; open eyes to check natural point of aim
• Butt-plate adjustment: if barrel high → push butt-plate down; if left/right → adjust feet

Aiming
• Approach target from 12 o'clock in standing position
• Aiming time must be < 8 seconds — picture degrades after one blink cycle
• Symmetry of front-sight insert in rear-sight aperture is critical
• Trust automatic centring reflexes; do not chase the 11

Trigger Control
• Trigger finger moves independently — zero effect on rifle or body
• Direction: backward, almost parallel to barrel axis
• Follow-through: maintain stability and sight picture for ~1 second AFTER release
• Dry-fire exercise: full concentration on follow-through with eyes closed

Breathing
• Slow stomach breathing reduces chest/shoulder movement and slows heart rate
• During last exhale barrel drops to centre → stop breathing → squeeze trigger
• Breathing hold: 5–10 seconds maximum. Beyond that: vision sharpens, muscles tense
• Barrel goes UP on inhale, DOWN on exhale

Shot Routine
• Consistent order: position check → deep breaths → cheekpiece → aiming → trigger
• Write down and rehearse routine; deviation under competition pressure causes errors

Scoring Rings (ISSF 10m Air Rifle)
• 10.9 = X-ring (innermost) | 10.0 = 10-ring | 9.0 = 9-ring | 8.0 = 8-ring | below = outer

MPI / Coordinate Interpretation
• x < 0 = shots left of centre (adjust sight RIGHT, or check trigger pull direction)
• x > 0 = shots right of centre (adjust sight LEFT)
• y < 0 = shots low (barrel dropping before shot — check breathing hold timing or premature trigger)
• y > 0 = shots high (barrel raised — possible flinch or early inhale)
• |MPI| < 0.3 = well-zeroed | 0.3–0.7 = minor correction needed | > 0.7 = significant drift

Group Radius
• < 2.0 = elite group tightness | 2.0–4.0 = competitive | 4.0–6.0 = developing | > 6.0 = fundamental issue

Standard Deviation of Scores
• < 0.5 = very consistent | 0.5–1.0 = acceptable | > 1.0 = technique instability

Series Analysis (10-shot groups)
• Declining later series → fatigue or loss of mental routine
• Early series worse than later → warm-up / settling issue

OUTPUT FORMAT
━━━━━━━━━━━━
Return ONLY a valid JSON object — no markdown, no explanation outside the JSON:
{
  "overallAssessment": "<2–3 sentences summarising the session quality and key theme>",
  "performanceRating": <number 1.0–10.0>,
  "findings": [
    {
      "category": "<positioning|trigger|breathing|consistency|endurance|sight|general>",
      "severity": "<critical|moderate|positive>",
      "title": "<concise title, max 6 words>",
      "observation": "<specific observation referencing the data>",
      "suggestion": "<concrete, actionable improvement>",
      "drill": "<optional: specific drill or exercise with repetitions>"
    }
  ],
  "prioritizedActions": ["<top action 1>", "<top action 2>", "<top action 3>"],
  "nextSessionFocus": "<one focused goal for the next training session>"
}
Provide 3–6 findings. Be precise — reference exact numbers from the data (e.g. "your MPI x of −0.82 indicates…").`;

const PERFORMANCE_ASSISTANT_SYSTEM = `You are an elite AI shooting performance assistant with expertise in Olympic/ISSF
shooting, military marksmanship, and sports science. You analyse a shooter's COMPLETE training history
and produce a comprehensive performance report covering technique, analytics, mental training,
physical conditioning, and actionable improvement plans.

You have deep knowledge of:
- Biomechanics of shooting stances (standing, prone, kneeling)
- Breathing patterns and heart rate management
- Trigger control mechanics and follow-through
- Mental performance, competition psychology, meditation for athletes
- Physical training (core stability, endurance, flexibility) for shooters
- Fatigue management and recovery protocols
- Statistical pattern recognition in shooting data

OUTPUT FORMAT — Return ONLY a valid JSON object:
{
  "overallRating": <1.0-10.0>,
  "summary": "<3-4 sentence executive summary of the shooter's current state and trajectory>",

  "techniqueInsights": [
    {
      "area": "<posture|breathing|trigger|stability|followThrough>",
      "status": "<strong|developing|needsWork>",
      "title": "<concise title>",
      "observation": "<data-backed observation>",
      "correction": "<specific correction technique>",
      "drill": "<optional drill with reps/duration>"
    }
  ],

  "performancePatterns": [
    {
      "type": "<accuracy|grouping|endurance|consistency|warmup>",
      "trend": "<improving|stable|declining>",
      "title": "<pattern name>",
      "detail": "<detailed explanation with data references>",
      "dataPoint": "<key metric value>"
    }
  ],

  "mentalRecommendations": [
    {
      "category": "<focus|calmness|competition|meditation|visualization>",
      "title": "<recommendation title>",
      "description": "<detailed guidance>",
      "routine": "<optional specific routine>",
      "duration": "<optional time commitment>"
    }
  ],

  "physicalRecommendations": [
    {
      "category": "<core|stability|endurance|flexibility|recovery>",
      "title": "<recommendation title>",
      "description": "<why this helps shooting performance>",
      "exercises": ["<exercise 1>", "<exercise 2>"],
      "frequency": "<how often>"
    }
  ],

  "smartAlerts": [
    {
      "severity": "<warning|info|success>",
      "title": "<alert title>",
      "message": "<explanation>",
      "actionItem": "<immediate action to take>"
    }
  ],

  "improvementPlan": {
    "timeframe": "<e.g. Next 4 weeks>",
    "goal": "<specific measurable goal>",
    "steps": ["<step 1>", "<step 2>", "<step 3>"],
    "milestones": ["<milestone 1>", "<milestone 2>"]
  },

  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"]
}

Provide 4-5 technique insights, 3-5 performance patterns, 3-4 mental recommendations,
3-4 physical recommendations, 2-4 smart alerts. Be precise with actual numbers.`;

@Injectable()
export class AiCoachService {
  private readonly groq: Groq;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const isValidKey = apiKey && !['dummy', 'placeholder', 'your-groq-api-key'].some(p => apiKey.startsWith(p));
    if (!isValidKey) {
      console.warn('GROQ_API_KEY is not configured. AI Coach features will not work.');
      this.groq = null as any; // Allow startup, fail on request
    } else {
      this.groq = new Groq({ apiKey });
    }
  }

  async analyzeSession(
    sessionId: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<AiCoachAnalysis> {
    // ── 1. Load session ──────────────────────────────────────────────────────
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: {
        shots: { orderBy: { shotNumber: 'asc' } },
        shooter: { select: { id: true, name: true } },
      },
    });

    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    // ── 2. Access control ────────────────────────────────────────────────────
    if (requesterRole === 'SHOOTER' && session.shooterId !== requesterId) {
      throw new ForbiddenException('Cannot analyse another shooter\'s session');
    }

    if (requesterRole === 'COACH') {
      const [connection, managedProfile] = await Promise.all([
        this.prisma.coachConnection.findFirst({
          where: { coachId: requesterId, shooterId: session.shooterId, status: 'APPROVED' },
          select: { id: true },
        }),
        this.prisma.shooterProfile.findFirst({
          where: { userId: session.shooterId, managedByCoachId: requesterId, isManaged: true },
          select: { id: true },
        }),
      ]);
      if (!connection && !managedProfile) {
        throw new ForbiddenException('No approved coaching relationship with this shooter');
      }
    }

    if (session.shots.length === 0) {
      throw new ForbiddenException('Session has no shots — record shots first');
    }

    // ── 3. Compute analytics ─────────────────────────────────────────────────
    const analytics = await this.analyticsService.computeForSession(sessionId);

    // ── 3b. Load biometric data (if available) ─────────────────────────────
    const biometricReadings = await this.prisma.biometricReading.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    let biometricSection = '';
    if (biometricReadings.length > 0) {
      const hrs = biometricReadings.map(r => r.heartRate).filter((v): v is number => v !== null);
      const spo2s = biometricReadings.map(r => r.spo2).filter((v): v is number => v !== null);
      const rrs = biometricReadings.map(r => r.respiratoryRate).filter((v): v is number => v !== null);
      const avgHr = hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : 0;
      const minHr = hrs.length ? Math.min(...hrs) : 0;
      const maxHr = hrs.length ? Math.max(...hrs) : 0;
      const avgSpo2 = spo2s.length ? spo2s.reduce((a, b) => a + b, 0) / spo2s.length : 0;
      const avgRr = rrs.length ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0;
      const hrv = hrs.length > 1
        ? Math.sqrt(hrs.reduce((sum, v) => sum + (v - avgHr) ** 2, 0) / (hrs.length - 1))
        : 0;
      const firstHalf = hrs.slice(0, Math.floor(hrs.length / 2));
      const secondHalf = hrs.slice(Math.floor(hrs.length / 2));
      const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
      const secondAvg = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
      const hrTrend = secondAvg > firstAvg + 2 ? 'rising' : secondAvg < firstAvg - 2 ? 'falling' : 'stable';

      biometricSection = `\nBIOMETRIC DATA\n━━━━━━━━━━━━━━\nAverage heart rate: ${avgHr.toFixed(1)} bpm (range: ${minHr}-${maxHr})\nHeart rate variability: ${hrv.toFixed(1)}\nAverage SpO2: ${avgSpo2.toFixed(1)}%\n${avgRr > 0 ? `Average respiratory rate: ${avgRr.toFixed(1)} breaths/min\n` : ''}HR trend: ${hrTrend}\nReadings during session: ${biometricReadings.length} data points\n`;
    }

    // ── 4. Build prompt ──────────────────────────────────────────────────────
    const scores = session.shots.map((s) => s.score);
    const distribution = {
      xRing:  scores.filter((s) => s >= 10.5).length,
      ring10: scores.filter((s) => s >= 10.0 && s < 10.5).length,
      ring9:  scores.filter((s) => s >= 9.0  && s < 10.0).length,
      ring8:  scores.filter((s) => s >= 8.0  && s < 9.0).length,
      outer:  scores.filter((s) => s < 8.0).length,
    };

    const shotSample = session.shots.slice(0, 60).map((s) => ({
      n: s.shotNumber,
      score: s.score,
      x: s.x,
      y: s.y,
    }));

    const trainingModeContext = session.trainingMode
      ? `Training Mode: ${session.trainingMode}\n`
      : '';

    const userPrompt = `
SESSION DATA
━━━━━━━━━━━
Discipline : ${session.discipline}
Distance   : ${session.distance}m
Weapon     : ${session.weaponType}
${trainingModeContext}Date       : ${new Date(session.sessionDate).toDateString()}
Total shots: ${session.shots.length}

ANALYTICS RESULTS
━━━━━━━━━━━━━━━━━
Average score  : ${analytics.averageScore}
Min / Max      : ${analytics.minScore} / ${analytics.maxScore}
MPI (x, y)     : (${analytics.mpi.x}, ${analytics.mpi.y})   [+ = right/high, − = left/low]
Group radius   : ${analytics.groupRadius}
Score std dev  : ${analytics.stdDev}
Series averages: ${analytics.seriesAverages.join(', ')}

SCORE RING DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━
X-ring (≥10.5) : ${distribution.xRing}  shots (${pct(distribution.xRing, session.shots.length)}%)
10-ring (≥10.0): ${distribution.ring10} shots (${pct(distribution.ring10, session.shots.length)}%)
9-ring  (≥9.0) : ${distribution.ring9}  shots (${pct(distribution.ring9, session.shots.length)}%)
8-ring  (≥8.0) : ${distribution.ring8}  shots (${pct(distribution.ring8, session.shots.length)}%)
Outer   (<8.0) : ${distribution.outer}  shots (${pct(distribution.outer, session.shots.length)}%)

SHOT COORDINATES (first ${shotSample.length} shots)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${shotSample.map((s) => `#${s.n}: score=${s.score}, x=${s.x}, y=${s.y}`).join('\n')}
${session.shots.length > 60 ? `... and ${session.shots.length - 60} more shots` : ''}
${biometricSection}
Please analyse this session and provide coaching feedback in the required JSON format.`;

    // ── 5. Call Groq ─────────────────────────────────────────────────────────
    if (!this.groq) {
      throw new InternalServerErrorException(
        'AI Coach requires a GROQ_API_KEY. Get a free key at https://console.groq.com/keys and add it to apps/api/.env',
      );
    }
    let raw: string;
    try {
      const completion = await this.groq.chat.completions.create({
        model: MODEL,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Coach unavailable: ${(err as Error).message}`,
      );
    }

    // ── 6. Parse response ────────────────────────────────────────────────────
    let parsed: Omit<AiCoachAnalysis, 'sessionId' | 'generatedAt' | 'model'>;
    try {
      // Strip potential markdown fences that Gemini sometimes adds
      const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(json);
    } catch {
      throw new InternalServerErrorException('AI returned an invalid response — please retry');
    }

    return {
      sessionId,
      overallAssessment: parsed.overallAssessment,
      performanceRating: parsed.performanceRating,
      findings: (parsed.findings ?? []) as AiCoachFinding[],
      prioritizedActions: parsed.prioritizedActions ?? [],
      nextSessionFocus: parsed.nextSessionFocus,
      generatedAt: new Date().toISOString(),
      model: MODEL,
    };
  }

  // ── Performance Assistant (comprehensive cross-session analysis) ────────

  async analyzePerformance(
    requesterId: string,
    requesterRole: UserRole,
    shooterId?: string,
  ): Promise<AiPerformanceAssistant> {
    // Resolve target shooter
    const targetShooterId = requesterRole === 'COACH'
      ? await this.resolveCoachShooter(requesterId, shooterId)
      : requesterId;

    // Fetch last 20 sessions with shots
    const sessions = await this.prisma.session.findMany({
      where: { shooterId: targetShooterId, deletedAt: null },
      include: { shots: { orderBy: { shotNumber: 'asc' } } },
      orderBy: { sessionDate: 'desc' },
      take: 20,
    });

    if (sessions.length === 0) {
      throw new ForbiddenException('No sessions found. Record sessions first to get AI insights.');
    }

    // Compute analytics for each session
    const sessionAnalytics: Array<{
      date: string; discipline: string; weapon: string; trainingMode: string | null;
      shots: number; avgScore: number; mpiX: number; mpiY: number;
      groupRadius: number; stdDev: number; seriesAvgs: number[];
      xRing: number; ring10: number; ring9: number; outer: number;
    }> = [];

    for (const session of sessions) {
      if (session.shots.length === 0) continue;
      const analytics = await this.analyticsService.computeForSession(session.id);
      const scores = session.shots.map(s => s.score);

      sessionAnalytics.push({
        date: new Date(session.sessionDate).toISOString().slice(0, 10),
        discipline: session.discipline,
        weapon: session.weaponType,
        trainingMode: session.trainingMode ?? null,
        shots: session.shots.length,
        avgScore: analytics.averageScore,
        mpiX: analytics.mpi.x,
        mpiY: analytics.mpi.y,
        groupRadius: analytics.groupRadius,
        stdDev: analytics.stdDev,
        seriesAvgs: analytics.seriesAverages,
        xRing: scores.filter(s => s >= 10.5).length,
        ring10: scores.filter(s => s >= 10.0 && s < 10.5).length,
        ring9: scores.filter(s => s >= 9.0 && s < 10.0).length,
        outer: scores.filter(s => s < 9.0).length,
      });
    }

    if (sessionAnalytics.length === 0) {
      throw new ForbiddenException('No sessions with shot data found.');
    }

    // Compute cross-session metrics
    const allAvgScores = sessionAnalytics.map(s => s.avgScore);
    const overallAvg = allAvgScores.reduce((a, b) => a + b, 0) / allAvgScores.length;
    const recentHalf = allAvgScores.slice(0, Math.ceil(allAvgScores.length / 2));
    const olderHalf = allAvgScores.slice(Math.ceil(allAvgScores.length / 2));
    const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
    const previousAvg = olderHalf.length > 0
      ? olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length
      : recentAvg;

    const avgGroupRadius = sessionAnalytics.reduce((a, b) => a + b.groupRadius, 0) / sessionAnalytics.length;
    const avgStdDev = sessionAnalytics.reduce((a, b) => a + b.stdDev, 0) / sessionAnalytics.length;
    const avgMpiX = sessionAnalytics.reduce((a, b) => a + b.mpiX, 0) / sessionAnalytics.length;
    const avgMpiY = sessionAnalytics.reduce((a, b) => a + b.mpiY, 0) / sessionAnalytics.length;

    // Fatigue: compare first vs last series averages across sessions
    const fatigueScores = sessionAnalytics
      .filter(s => s.seriesAvgs.length >= 2)
      .map(s => s.seriesAvgs[s.seriesAvgs.length - 1] - s.seriesAvgs[0]);
    const avgFatigue = fatigueScores.length > 0
      ? fatigueScores.reduce((a, b) => a + b, 0) / fatigueScores.length
      : 0;

    // Total shot distribution
    const totalXRing = sessionAnalytics.reduce((a, b) => a + b.xRing, 0);
    const totalRing10 = sessionAnalytics.reduce((a, b) => a + b.ring10, 0);
    const totalRing9 = sessionAnalytics.reduce((a, b) => a + b.ring9, 0);
    const totalOuter = sessionAnalytics.reduce((a, b) => a + b.outer, 0);
    const totalShots = sessionAnalytics.reduce((a, b) => a + b.shots, 0);

    const disciplines = [...new Set(sessionAnalytics.map(s => s.discipline))];
    const weapons = [...new Set(sessionAnalytics.map(s => s.weapon))];

    const userPrompt = `SHOOTER PERFORMANCE DATA — Cross-Session Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sessions analysed: ${sessionAnalytics.length}
Date range: ${sessionAnalytics[sessionAnalytics.length - 1].date} to ${sessionAnalytics[0].date}
Disciplines: ${disciplines.join(', ')}
Weapons: ${weapons.join(', ')}

AGGREGATE METRICS
━━━━━━━━━━━━━━━━
Overall average score: ${overallAvg.toFixed(2)}
Recent sessions avg: ${recentAvg.toFixed(2)} | Earlier sessions avg: ${previousAvg.toFixed(2)}
Average group radius: ${avgGroupRadius.toFixed(2)}
Average std deviation: ${avgStdDev.toFixed(2)}
Average MPI: (${avgMpiX.toFixed(2)}, ${avgMpiY.toFixed(2)})
Average fatigue delta (last series - first series): ${avgFatigue.toFixed(3)}
Total shots: ${totalShots}

SHOT DISTRIBUTION (all sessions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
X-ring (>=10.5): ${totalXRing} (${pct(totalXRing, totalShots)}%)
10-ring (>=10.0): ${totalRing10} (${pct(totalRing10, totalShots)}%)
9-ring (>=9.0): ${totalRing9} (${pct(totalRing9, totalShots)}%)
Outer (<9.0): ${totalOuter} (${pct(totalOuter, totalShots)}%)

SESSION-BY-SESSION DATA
━━━━━━━━━━━━━━━━━━━━━━━
${sessionAnalytics.map((s, i) => `#${i + 1} [${s.date}] ${s.discipline} ${s.weapon}${s.trainingMode ? ' (' + s.trainingMode + ')' : ''}: avg=${s.avgScore}, GR=${s.groupRadius}, SD=${s.stdDev}, MPI=(${s.mpiX},${s.mpiY}), ${s.shots} shots, series=[${s.seriesAvgs.map(v => v.toFixed(1)).join(',')}]`).join('\n')}

SCORE TREND (newest first): ${allAvgScores.map(s => s.toFixed(2)).join(' → ')}

Analyse this shooter's complete history and provide the comprehensive performance assistant response in the required JSON format.`;

    if (!this.groq) {
      throw new InternalServerErrorException(
        'AI Performance Assistant requires a GROQ_API_KEY. Get a free key at https://console.groq.com/keys and add it to apps/api/.env',
      );
    }
    let raw: string;
    try {
      const completion = await this.groq.chat.completions.create({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          { role: 'system', content: PERFORMANCE_ASSISTANT_SYSTEM },
          { role: 'user',   content: userPrompt },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      throw new InternalServerErrorException(
        `AI Performance Assistant unavailable: ${(err as Error).message}`,
      );
    }

    let parsed: any;
    try {
      const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(json);
    } catch {
      throw new InternalServerErrorException('AI returned an invalid response — please retry');
    }

    const percentChange = previousAvg > 0
      ? ((recentAvg - previousAvg) / previousAvg) * 100
      : 0;

    return {
      shooterId: targetShooterId,
      generatedAt: new Date().toISOString(),
      model: MODEL,
      sessionsAnalyzed: sessionAnalytics.length,
      overallRating: parsed.overallRating ?? 5,
      summary: parsed.summary ?? '',
      techniqueInsights: parsed.techniqueInsights ?? [],
      performancePatterns: parsed.performancePatterns ?? [],
      mentalRecommendations: parsed.mentalRecommendations ?? [],
      physicalRecommendations: parsed.physicalRecommendations ?? [],
      smartAlerts: parsed.smartAlerts ?? [],
      improvementPlan: parsed.improvementPlan ?? { timeframe: '4 weeks', goal: 'Improve consistency', steps: [], milestones: [] },
      sessionComparison: {
        recentAvg: Math.round(recentAvg * 100) / 100,
        previousAvg: Math.round(previousAvg * 100) / 100,
        trend: percentChange > 1 ? 'improving' : percentChange < -1 ? 'declining' : 'stable',
        percentChange: Math.round(percentChange * 100) / 100,
      },
      weaknesses: parsed.weaknesses ?? [],
      strengths: parsed.strengths ?? [],
    };
  }

  private async resolveCoachShooter(coachId: string, shooterId?: string): Promise<string> {
    if (!shooterId) throw new ForbiddenException('shooterId is required for coach access');
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
      throw new ForbiddenException('No approved coaching relationship with this shooter');
    }
    return shooterId;
  }
}

function pct(n: number, total: number): string {
  return total === 0 ? '0' : ((n / total) * 100).toFixed(0);
}
