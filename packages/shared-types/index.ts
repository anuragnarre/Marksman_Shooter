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
  shooterProfile?: ShooterProfile | null;
}

export interface ShooterProfile {
  id: string;
  userId: string;
  shooterCode: string;
  primaryWeapon?: string | null;
  managedByCoachId?: string | null;
  isManaged: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateManagedShooterProfileRequest {
  name: string;
  shooterCode: string;
  primaryWeapon?: string;
}

export interface UpdateManagedShooterProfileRequest {
  name?: string;
  shooterCode?: string;
  primaryWeapon?: string | null;
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

export interface CoachShooterPerformanceSummary {
  shooterId: string;
  totalSessions: number;
  totalShots: number;
  averageScore: number;
  bestScore: number;
  lastSessionDate: string | null;
}

export interface CoachDashboardShooterSummary {
  shooterId: string;
  shooterName: string;
  shooterCode?: string | null;
  primaryWeapon?: string | null;
  isManaged: boolean;
  totalSessions: number;
  totalShots: number;
  averageScore: number;
  bestScore: number;
  consistency: number;
  recentForm: number;
  lastSessionDate: string | null;
}

export interface CoachDashboardRecentSession {
  sessionId: string;
  shooterId: string;
  shooterName: string;
  sessionDate: string;
  discipline: string;
  weaponType: string;
  trainingMode?: string | null;
  totalShots: number;
  averageScore: number;
  groupRadius: number;
}

export interface CoachDashboardScheduleItem {
  eventId: string;
  title: string;
  eventType: EventType;
  start: string;
  end: string;
  allDay: boolean;
  assigneeCount: number;
  shooterNames: string[];
}

export interface CoachDashboardAnalyticsOverview {
  totalShooters: number;
  activeShooters30d: number;
  totalSessions: number;
  totalShots: number;
  averageScore: number;
  xRingRate: number;
  pendingRequests: number;
  upcomingItems7d: number;
  plannedTasks: number;
}

export interface CoachDashboardData {
  generatedAt: string;
  analytics: CoachDashboardAnalyticsOverview;
  shooterSummaries: CoachDashboardShooterSummary[];
  recentSessions: CoachDashboardRecentSession[];
  schedule: CoachDashboardScheduleItem[];
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

// ── AI Performance Assistant ──────────────────────────────────────────────────

export interface TechniqueInsight {
  area: 'posture' | 'breathing' | 'trigger' | 'stability' | 'followThrough';
  status: 'strong' | 'developing' | 'needsWork';
  title: string;
  observation: string;
  correction: string;
  drill?: string;
}

export interface PerformancePattern {
  type: 'accuracy' | 'grouping' | 'endurance' | 'consistency' | 'warmup';
  trend: 'improving' | 'stable' | 'declining';
  title: string;
  detail: string;
  dataPoint: string;
}

export interface MentalRecommendation {
  category: 'focus' | 'calmness' | 'competition' | 'meditation' | 'visualization';
  title: string;
  description: string;
  routine?: string;
  duration?: string;
}

export interface PhysicalRecommendation {
  category: 'core' | 'stability' | 'endurance' | 'flexibility' | 'recovery';
  title: string;
  description: string;
  exercises?: string[];
  frequency?: string;
}

export interface SmartAlert {
  severity: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  actionItem: string;
}

export interface ImprovementPlan {
  timeframe: string;
  goal: string;
  steps: string[];
  milestones: string[];
}

export interface AiPerformanceAssistant {
  shooterId: string;
  generatedAt: string;
  model: string;
  sessionsAnalyzed: number;

  overallRating: number;
  summary: string;

  techniqueInsights: TechniqueInsight[];
  performancePatterns: PerformancePattern[];
  mentalRecommendations: MentalRecommendation[];
  physicalRecommendations: PhysicalRecommendation[];
  smartAlerts: SmartAlert[];
  improvementPlan: ImprovementPlan;

  sessionComparison: {
    recentAvg: number;
    previousAvg: number;
    trend: 'improving' | 'stable' | 'declining';
    percentChange: number;
  };

  weaknesses: string[];
  strengths: string[];
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

// ── Biometrics / Wearable Integration ─────────────────────────────────────

export type DeviceTypeEnum = 'CUSTOM_SENSOR' | 'HEALTH_CONNECT' | 'MANUAL';

export interface DeviceRegistration {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: DeviceTypeEnum;
  apiKey?: string; // only returned once on creation
  lastSeenAt?: Date | string | null;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface BiometricReading {
  id: string;
  deviceId: string;
  userId: string;
  sessionId?: string | null;
  timestamp: Date | string;
  receivedAt: Date | string;
  heartRate?: number | null;
  spo2?: number | null;
  respiratoryRate?: number | null;
  stressLevel?: number | null;
  steps?: number | null;
  calories?: number | null;
  activeMinutes?: number | null;
  readingType: string;
  confidence?: number | null;
}

export interface VitalsPayload {
  type: 'quick_estimate' | 'optimal_read';
  heart_rate: number;
  spo2: number;
}

export interface HealthConnectReading {
  timestamp: string;
  heartRate?: number;
  spo2?: number;
  respiratoryRate?: number;
  steps?: number;
  calories?: number;
  activeMinutes?: number;
}

export interface HealthConnectSyncPayload {
  readings: HealthConnectReading[];
  sessionId?: string;
}

export interface BiometricSummary {
  sessionId: string;
  avgHeartRate: number;
  minHeartRate: number;
  maxHeartRate: number;
  hrv: number;
  avgSpo2: number;
  avgRespiratoryRate: number | null;
  readingCount: number;
}

export type BiometricInsightCategory =
  | 'heart_rate'
  | 'breathing'
  | 'fatigue'
  | 'optimal_window'
  | 'correlation'
  | 'general';

export type BiometricInsightSeverity = 'critical' | 'moderate' | 'positive';

export interface BiometricInsight {
  category: BiometricInsightCategory;
  severity: BiometricInsightSeverity;
  title: string;
  observation: string;
  recommendation: string;
}

export interface AiBiometricAnalysis {
  sessionId: string;
  summary: string;
  performanceCorrelation: string;
  insights: BiometricInsight[];
  optimalWindows: { startIndex: number; endIndex: number; avgHr: number; avgScore: number }[];
  generatedAt: string;
  model: string;
}

export interface BiometricUpdateEvent {
  userId: string;
  sessionId?: string | null;
  reading: BiometricReading;
}

export interface BiometricTrendPoint {
  date: string;
  avgHeartRate: number;
  minHeartRate: number;
  maxHeartRate: number;
  avgSpo2: number;
  readingCount: number;
}
