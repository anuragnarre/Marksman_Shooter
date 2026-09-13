export type UserRole = 'SHOOTER' | 'COACH' | 'SOLDIER';
export type ConnectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ConnectionInitiator = 'SHOOTER' | 'COACH';
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
export interface Shot {
    id: string;
    sessionId: string;
    shotNumber: number;
    score: number;
    x: number;
    y: number;
    timestamp: Date;
}
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
export interface SuggestionResult {
    sessionId: string;
    suggestions: string[];
}
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
export interface ShotInput {
    shotNumber: number;
    score: number;
    x?: number;
    y?: number;
}
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
export type AiCoachCategory = 'positioning' | 'trigger' | 'breathing' | 'consistency' | 'endurance' | 'sight' | 'general';
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
    performanceRating: number;
    findings: AiCoachFinding[];
    prioritizedActions: string[];
    nextSessionFocus: string;
    generatedAt: string;
    model: string;
}
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
export declare const ARMY_WEAPONS: readonly ['AK-203', 'Sig Sauer SIG716', 'Tavor X95', 'Dragunov (SVD)', 'Glock 17', 'Glock 19', 'Pistol Auto 9mm 1A', 'ASMI', 'Beretta Px4 Storm', 'INSAS', 'AK-47', 'Custom Gun'];
export declare const TRAINING_MODES: readonly ['Marksmanship', 'Rapid Fire', 'Field Exercise', 'Combat Simulation', 'Qualification'];
export declare const TRAINING_MODE_COLORS: Record<string, string>;
export interface WeaponPerformance {
    weaponType: string;
    sessions: number;
    averageScore: number;
    bestScore: number;
    totalShots: number;
    groupRadius: number;
}
