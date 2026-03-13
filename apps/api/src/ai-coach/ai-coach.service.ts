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
import { AiCoachAnalysis, AiCoachFinding } from '@shooting-platform/shared-types';

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

@Injectable()
export class AiCoachService {
  private readonly groq: Groq;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in .env — get a free key at https://console.groq.com/keys');
    }
    this.groq = new Groq({ apiKey });
  }

  async analyzeSession(
    sessionId: string,
    requesterId: string,
    requesterRole: 'SHOOTER' | 'COACH' | 'SOLDIER',
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
    if ((requesterRole === 'SHOOTER' || requesterRole === 'SOLDIER') && session.shooterId !== requesterId) {
      throw new ForbiddenException('Cannot analyse another shooter\'s session');
    }

    if (requesterRole === 'COACH') {
      const connection = await this.prisma.coachConnection.findFirst({
        where: { coachId: requesterId, shooterId: session.shooterId, status: 'APPROVED' },
      });
      if (!connection) {
        throw new ForbiddenException('No approved coaching relationship with this shooter');
      }
    }

    if (session.shots.length === 0) {
      throw new ForbiddenException('Session has no shots — record shots first');
    }

    // ── 3. Compute analytics ─────────────────────────────────────────────────
    const analytics = await this.analyticsService.computeForSession(sessionId);

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

Please analyse this session and provide coaching feedback in the required JSON format.`;

    // ── 5. Call Groq ─────────────────────────────────────────────────────────
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
}

function pct(n: number, total: number): string {
  return total === 0 ? '0' : ((n / total) * 100).toFixed(0);
}
