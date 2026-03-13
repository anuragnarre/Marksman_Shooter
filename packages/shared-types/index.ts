// packages/shared-types/index.ts
// Shared TypeScript interfaces mirroring every Prisma model.
// Consumed by both /apps/web and /apps/api.

export type UserRole = 'SHOOTER' | 'COACH' | 'SOLDIER';
export type ConnectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Session {
  id: string;
  shooterId: string;
  discipline: string;
  distance: number;
  weaponType: string;
  numberOfShots: number;
  sessionDate: Date;
  createdAt: Date;
  deletedAt?: Date | null;
  trainingMode?: string | null;
  shots?: Shot[];
  feedback?: CoachFeedback[];
}

// ── Army / Soldier constants ──────────────────────────────────────────────────

export const ARMY_WEAPONS = [
  'AK-203',
  'Sig Sauer SIG716',
  'Tavor X95',
  'Dragunov (SVD)',
  'Glock 17',
  'Glock 19',
  'Pistol Auto 9mm 1A',
  'ASMI',
  'Beretta Px4 Storm',
  'INSAS',
  'AK-47',
  'Custom Gun',
] as const;

export const TRAINING_MODES = [
  'Marksmanship',
  'Rapid Fire',
  'Field Exercise',
  'Combat Simulation',
  'Qualification',
] as const;

export const TRAINING_MODE_COLORS: Record<string, string> = {
  Marksmanship:       '#4FC3F7',
  'Rapid Fire':       '#FF4D6D',
  'Field Exercise':   '#00E5A0',
  'Combat Simulation':'#F5A623',
  Qualification:      '#8892A4',
};

export interface WeaponPerformance {
  weaponType: string;
  sessions: number;
  averageScore: number;
  bestScore: number;
  totalShots: number;
  groupRadius: number;
}

export interface Shot {
  id: string;
  sessionId: string;
  shotNumber: number;
  score: number;
  x: number;
  y: number;
  timestamp: Date;
}

export type ConnectionInitiator = 'SHOOTER' | 'COACH';

export interface CoachConnection {
  id: string;
  shooterId: string;
  coachId: string;
  status: ConnectionStatus;
  initiatedBy: ConnectionInitiator;
  createdAt?: Date;
  shooter?: User;
  coach?: User;
}

export interface CoachFeedback {
  id: string;
  coachId: string;
  sessionId: string;
  feedback: string;
  createdAt: Date;
  coach?: User;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface MeanPointOfImpact {
  x: number;
  y: number;
}

export interface AnalyticsResult {
  sessionId: string;
  totalShots: number;
  averageScore: number;
  mpi: MeanPointOfImpact;
  groupRadius: number;
  stdDev: number;
  seriesAverages: number[];
  minScore: number;
  maxScore: number;
}

// ── Overview Analytics (cross-session) ───────────────────────────────────────

export interface SessionTrendPoint {
  sessionId: string;
  date: string;
  discipline: string;
  weaponType: string;
  avgScore: number;
  totalShots: number;
  groupRadius: number;
  stdDev: number;
  xRingCount: number;
}

export interface RingDistributionBucket {
  ring: string;
  count: number;
  pct: number;
  color: string;
}

export interface OverviewAnalytics {
  totalSessions: number;
  totalShots: number;
  overallAverage: number;
  bestScore: number;
  bestSessionAvg: number;
  consistency: number;
  sessionTrend: SessionTrendPoint[];
  ringDistribution: RingDistributionBucket[];
  topDiscipline: string;
}

// ── Suggestions ───────────────────────────────────────────────────────────────

export interface SuggestionResult {
  sessionId: string;
  suggestions: string[];
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Shot Input ────────────────────────────────────────────────────────────────

export interface ShotInput {
  shotNumber: number;
  score: number;
  x?: number;
  y?: number;
}

// ── Vision Service ────────────────────────────────────────────────────────────

export interface VisionShotResult {
  shotNumber: number;
  score: number;
  x: number;
  y: number;
  pixelX: number;
  pixelY: number;
  confidence: number;
}

export interface VisionAnalysisResponse {
  shots: VisionShotResult[];
  targetDetected: boolean;
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number;
}

// ── AI Coach ──────────────────────────────────────────────────────────────────

export type AiCoachCategory =
  | 'positioning'
  | 'trigger'
  | 'breathing'
  | 'consistency'
  | 'endurance'
  | 'sight'
  | 'general';

export type AiCoachSeverity = 'critical' | 'moderate' | 'positive';

export interface AiCoachFinding {
  category: AiCoachCategory;
  severity: AiCoachSeverity;
  title: string;
  observation: string;
  suggestion: string;
  drill?: string;
}

export interface AiCoachAnalysis {
  sessionId: string;
  overallAssessment: string;
  performanceRating: number; // 1–10
  findings: AiCoachFinding[];
  prioritizedActions: string[];
  nextSessionFocus: string;
  generatedAt: string;
  model: string;
}

// ── WebSocket Events ──────────────────────────────────────────────────────────

export interface SessionUpdatedEvent {
  sessionId: string;
  newShotCount: number;
}

export interface FeedbackAddedEvent {
  sessionId: string;
  feedback: CoachFeedback;
}

export interface ConnectionNotificationEvent {
  connectionId: string;
}

export interface ConnectionResponseEvent {
  connectionId: string;
  accepted: boolean;
}

// ── Calendar / Training Events ────────────────────────────────────────────────

export type EventType = 'SESSION' | 'TASK' | 'PLAN' | 'REMINDER' | 'COMPETITION';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export const EVENT_TYPE_META: Record<EventType, { label: string; color: string; bg: string }> = {
  SESSION:     { label: 'Session',     color: '#F5A623', bg: 'rgba(245,166,35,0.15)' },
  TASK:        { label: 'Task',        color: '#4FC3F7', bg: 'rgba(79,195,247,0.15)' },
  PLAN:        { label: 'Plan',        color: '#00E5A0', bg: 'rgba(0,229,160,0.15)' },
  REMINDER:    { label: 'Reminder',    color: '#8892A4', bg: 'rgba(136,146,164,0.15)' },
  COMPETITION: { label: 'Competition', color: '#FF4D6D', bg: 'rgba(255,77,109,0.15)' },
};

export interface EventAssignee {
  id: string;
  eventId: string;
  shooterId: string;
  shooter?: User;
  status: string;
}

export interface TrainingEvent {
  id: string;
  title: string;
  description?: string | null;
  eventType: EventType;
  start: Date | string;
  end: Date | string;
  allDay: boolean;
  color?: string | null;
  recurringGroupId?: string | null;
  coachId: string;
  coach?: User;
  assignees?: EventAssignee[];
  assigneeStatus?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

// ── Performance / Deep Analysis ───────────────────────────────────────────────

export interface DeepAnalysis {
  sessionId: string;
  fatigueIndex: number;
  focusScore: number;
  outlierShots: number[];
  clusterCount: number;
  warmupShots: number;
  peakSeriesIndex: number;
  peakSeriesAvg: number;
}

export interface SessionContextInput {
  heartRate?: number;
  perceivedEffort?: number;
  windCondition?: string;
  temperature?: number;
  notes?: string;
}

export interface SessionContext {
  id: string;
  sessionId: string;
  heartRate?: number | null;
  perceivedEffort?: number | null;
  windCondition?: string | null;
  temperature?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface TrainingPlanSession {
  day: string;
  drill: string;
  sets: number;
  shots: number;
  restMinutes: number;
  notes: string;
}

export interface TrainingPlanWeek {
  week: number;
  focus: string;
  sessions: TrainingPlanSession[];
}

export interface TrainingPlan {
  id: string;
  generatedAt: string;
  weekStart: string;
  focusAreas: string[];
  weeks: TrainingPlanWeek[];
  coachingNote: string;
}

// ── Pose Analysis ─────────────────────────────────────────────────────────────

export interface PoseAnalysisResult {
  detected: boolean;
  postureScore?: number;
  elbowAngle?: number;
  shoulderTilt?: number;
  headTilt?: number;
  issues?: string[];
  keypoints?: [number, number, number, number][];
}

// ── Schedule Change Requests ──────────────────────────────────────────────────

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ScheduleRequest {
  id: string;
  eventId: string;
  event?: {
    id: string;
    title: string;
    start: Date | string;
    end: Date | string;
    eventType: EventType;
    coachId: string;
  };
  shooterId: string;
  shooter?: { id: string; name: string; email: string };
  coachId: string;
  coach?: { id: string; name: string; email: string };
  status: RequestStatus;
  suggestedStart?: Date | string | null;
  suggestedEnd?: Date | string | null;
  suggestedTitle?: string | null;
  notes?: string | null;
  coachNote?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string | null;
}
