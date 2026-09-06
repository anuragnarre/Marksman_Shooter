# MARKSMAN — Master Improvement Plan
### All-in-One Platform: Range Operations · Player Management · Coaching

> **Analysis Date**: September 2026  
> **Codebase**: NestJS API · Next.js 15 Web · Capacitor Android · PostgreSQL/Prisma · Groq AI (Llama 3.3 70B) · Android Health Connect

---

## 🔍 CURRENT STATE AUDIT

### What Exists (Confirmed by Code Analysis)

| Module | Status | Code Location | Notes |
|--------|--------|---------------|-------|
| Session CRUD | ✅ Full | `sessions/` | Soft-delete, coach access guard |
| Shot recording + analytics | ✅ Full | `shots/`, `analytics/` | MPI, group radius, std dev, series avgs |
| AI Coach (per-session) | ✅ Working | `ai-coach/ai-coach.service.ts` | Groq Llama 3.3 70B, biometric context injected |
| AI Performance Assistant (cross-session) | ✅ Working | `ai-coach/ai-coach.service.ts` | 20-session window, k-means cluster, fatigue slope |
| AI Training Plan Generator | ✅ Working | `performance/performance.service.ts` | 4-week plan via Groq, Spearman focus score |
| Coach ↔ Shooter connections | ✅ Full | `coach/` | Bidirectional invite/approve, managed shooters |
| Coach dashboard | ✅ Working | `coach/coach.service.ts` | Aggregate stats, schedule, recent sessions |
| Calendar / Training Events | ✅ Full | `calendar/`, `events/` | Recurring, assignees, schedule change requests |
| Biometric integration | ✅ Working | `biometrics/` | Custom sensor + Health Connect, AI analysis |
| Equipment tracking | ⚠️ Stub | `equipment/` | Bare CRUD, `dto: any`, no validation |
| Ballistics calculator | ⚠️ Stub | `ballistics/` | Basic calculate + list, no DTOs |
| Range Locations | ⚠️ Stub | `ranges/` | 7 fields only, no lanes, no booking |
| Computer Vision scoring | ✅ Working | `vision/` | ISSF target detection |
| Pose analysis | ✅ Working | (vision service) | Postural score, elbow/shoulder/head tilt |
| WebSocket live gateway | ✅ Working | `gateway/` | Session updates, feedback, connection events |
| Auth (JWT + Google OAuth) | ✅ Full | `auth/` | Roles: SHOOTER, COACH only |
| PWA + Capacitor Android | ✅ Working | `web/` | Health Connect, offline banner |

### Critical Gaps (By Stakeholder)

**Range Operator**: No lane management, no booking system, no member management, no billing, no safety/compliance tools, no operational dashboards.  
**Individual Shooter**: No comprehensive profile, no licensing/certification, no PB tracking, no achievement system, no rank/ELO, no notification system.  
**Coach**: No group session management, no drill library, no training plan templates, no report generation, no in-app messaging, no multi-shooter live monitoring.  
**All**: No payment system, no email/push notifications, no competition management, no API validation DTOs on equipment/ballistics/ranges, no role beyond SHOOTER and COACH.

---

## CATEGORY 1: API HARDENING & TECHNICAL DEBT
*Must fix first — blocks all other development safely*

### 1.1 — DTO Validation (CRITICAL — currently untyped)

**Problem**: The three open controllers (`equipment`, `ranges`, `ballistics`) all use `dto: any` with zero validation. Any payload gets written directly to the database.

- **1.1.1** Create `CreateEquipmentDto` and `UpdateEquipmentDto` with `class-validator` decorators: `name` (string, required), `type` (enum: RIFLE / PISTOL / SHOTGUN / CROSSBOW / OTHER), `serialNumber` (optional string, max 50), `caliber` (optional string), `purchaseDate` (optional ISO date string), `notes` (optional string, max 500)
- **1.1.2** Create `CreateRangeDto` and `UpdateRangeDto`: `name` (required, max 100), `status` (enum: Active / Inactive / Maintenance), `maxDistance` (optional number, 1–2000), `altitude` (optional number), `gpsCoordinates` (optional string matching lat/lng pattern), `typicalWindDir` (optional string), `maxCaliber` (optional string)
- **1.1.3** Create `CreateBallisticsDto`: `weaponType` (required string), `caliber` (required string), `bulletWeightGrains` (required number, min 1 max 1000), `muzzleVelocityFps` (required number, min 100 max 5000), `ballisticCoefficient` (required number), `zeroDistanceYards` (required number), `atmosphericConditions` (optional nested object: temp, humidity, altitude, windSpeedMph, windAngleDeg)
- **1.1.4** Enable `ValidationPipe` globally in `main.ts` with `whitelist: true, forbidNonWhitelisted: true, transform: true` — currently not enforced globally
- **1.1.5** Add `class-transformer` `@Transform()` decorators to sanitize all string inputs (trim whitespace, strip null bytes)
- **1.1.6** Add `@IsOptional()` + `@MaxLength()` to all text fields across ALL existing DTOs (`CreateSessionDto`, `CreateFeedbackDto`, etc.) — audit and patch each

### 1.2 — API Documentation

- **1.2.1** Install `@nestjs/swagger` and configure `SwaggerModule.setup('api/docs', ...)` in `main.ts`
- **1.2.2** Add `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, `@ApiBearerAuth()` to all controllers
- **1.2.3** Add `@ApiProperty()` to all DTO classes
- **1.2.4** Add `@ApiPropertyOptional()` to optional fields in all DTOs
- **1.2.5** Generate and commit the `openapi.json` spec to the repo root — used by mobile app and hardware partners

### 1.3 — Rate Limiting & Security

- **1.3.1** Install `@nestjs/throttler` and configure with Redis store: Auth endpoints → 5 req/min per IP, all other endpoints → 100 req/min per user
- **1.3.2** Add `helmet()` middleware in `main.ts`: sets `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- **1.3.3** Tighten CORS configuration: restrict `origin` to `['https://marksmanspro.com', 'https://www.marksmanspro.com', 'http://localhost:3000']` — currently too permissive
- **1.3.4** Add `sanitize-html` or `DOMPurify` sanitization to all rich-text fields (coach feedback, session notes, drill descriptions)
- **1.3.5** Implement `@UseInterceptors(ClassSerializerInterceptor)` globally to prevent accidental password hash / sensitive field leaks in responses
- **1.3.6** Move all `console.warn` / `console.log` in production code to a proper `Logger` service with log levels (NestJS `Logger` class)

### 1.4 — Database Indexes & Query Optimization

- **1.4.1** Add Prisma `@@index` to all foreign key fields not already indexed: `Session.shooterId`, `Shot.sessionId`, `CoachConnection.shooterId`, `CoachConnection.coachId`, `BiometricReading.sessionId`, `BiometricReading.userId`, `TrainingEvent.coachId`
- **1.4.2** Add composite index `@@index([shooterId, deletedAt, sessionDate])` on `Session` — the most common query pattern
- **1.4.3** Add pagination (`skip`, `take`) to all `findMany` queries that currently return unbounded arrays: sessions list, shots list, equipment list, ranges list
- **1.4.4** Add `?page=1&limit=20&sort=sessionDate&order=desc` query parameters to all list endpoints
- **1.4.5** Cache the coach dashboard query (`/coach/dashboard`) in Redis with a 60-second TTL — this query joins 5+ tables and is called on every coach page load
- **1.4.6** Add `@@index([coachId, status])` on `CoachConnection` — the `getPendingRequests` query pattern
- **1.4.7** Add read replica support via a second `DATABASE_URL_REPLICA` environment variable — route analytics and report queries to the replica

### 1.5 — Background Job Queue

- **1.5.1** Install `@nestjs/bull` with Redis backend — move AI analysis, email sending, PDF export, and report generation to async jobs
- **1.5.2** Create `AiAnalysisQueue`: when a session ends, auto-queue an AI coach analysis job (fires within 30 seconds of session completion, not on user request)
- **1.5.3** Create `EmailQueue`: all transactional emails go through this queue with retry on failure (3 retries, exponential backoff)
- **1.5.4** Create `ExportQueue`: PDF and Excel report generation runs in the background; user gets a download link via notification when complete
- **1.5.5** Add Bull Board UI at `/admin/queues` (accessible to RANGE_ADMIN role only) for monitoring queue health

### 1.6 — Soft Delete Consistency

- **1.6.1** Add `deletedAt DateTime?` to `Equipment`, `RangeLocation`, `User`, `TrainingEvent`, `CoachConnection` models in Prisma schema
- **1.6.2** Add Prisma middleware that automatically appends `WHERE deletedAt IS NULL` to all `findMany` and `findFirst` queries for models with `deletedAt`
- **1.6.3** Add `restore/:id` endpoints for admin users to undo accidental deletions within 30 days

---

## CATEGORY 2: RANGE MANAGEMENT MODULE
*The biggest missing pillar — the platform currently has no range operations capability*

### 2.1 — Lane & Bay Management System

**New Prisma models needed**: `Lane`, `LaneStatus`, `LaneReservation`, `LaneInspectionLog`

- **2.1.1** `Lane` model: `id`, `rangeId` (FK → RangeLocation), `laneNumber` (int), `status` (enum: OPEN / OCCUPIED / RESERVED / MAINTENANCE / CLOSED), `supportedDistances` (int[] — array of meters), `targetFrameType` (string), `maxCaliber` (string), `currentSessionId` (nullable FK → Session), `lastInspectedAt` (datetime), `notes` (string)
- **2.1.2** API endpoints: `GET /ranges/:id/lanes` (list all lanes with live status), `POST /ranges/:id/lanes` (add lane), `PATCH /ranges/:id/lanes/:laneId` (update), `PATCH /ranges/:id/lanes/:laneId/status` (change status only — for RSO use)
- **2.1.3** Lane assignment flow: when shooter starts a session, optionally assign a lane (`PATCH /sessions/:id/assign-lane`) — marks lane as OCCUPIED, links session
- **2.1.4** Auto-release: when session ends (soft-deleted or completed), lane status reverts to OPEN via a database trigger or NestJS event listener
- **2.1.5** Real-time lane board: `GET /ranges/:id/lanes/live` returns live status of all lanes — WebSocket event `lane:status_changed` pushed to all RANGE_ADMIN/STAFF connections on any status change
- **2.1.6** Lane drag-and-drop assignment UI (web): staff dashboard shows a bird's-eye range map with color-coded lanes; drag a shooter's name onto a lane
- **2.1.7** Lane inspection log: `POST /ranges/:id/lanes/:laneId/inspection` records a daily opening inspection (RSO, timestamp, checklist results as JSON, photos as S3 URLs)

### 2.2 — Booking & Scheduling System

**New Prisma models**: `TimeSlot`, `Booking`, `Waitlist`

- **2.2.1** `TimeSlot` model: `rangeId`, `laneId`, `startTime`, `endTime`, `capacity` (number of shooters), `slotType` (enum: WALK_IN / RESERVATION_ONLY), `status` (enum: AVAILABLE / FULL / CLOSED)
- **2.2.2** Time slot generator: admin sets operating hours per day-of-week + slot duration (e.g., 1 hr slots, Mon-Fri 09:00–21:00) → system auto-generates time slots 30 days ahead via a scheduled cron job
- **2.2.3** `Booking` model: `userId`, `laneId`, `slotId`, `numberOfShooters`, `status` (PENDING / CONFIRMED / CANCELLED / NO_SHOW), `bookingReference` (unique 8-char alphanumeric), `paymentId` (nullable), `checkInAt` (nullable datetime), `notes`
- **2.2.4** Booking API: `POST /bookings` (create booking), `GET /bookings/my` (my bookings), `PATCH /bookings/:id/cancel` (cancel), `POST /bookings/:id/check-in` (RSO/STAFF marks arrival), `GET /ranges/:id/availability?date=2026-09-15` (public — no auth — returns slot availability matrix)
- **2.2.5** Group booking: `numberOfShooters` > 1 on a booking reserves proportional lane capacity; coach can book for a squad
- **2.2.6** Recurring bookings: `recurringType` (NONE / WEEKLY / BIWEEKLY) on the Booking model; backend auto-creates future bookings for N weeks
- **2.2.7** Waitlist: when a slot is FULL, shooter joins `Waitlist` with `position` field; on cancellation, next-in-line gets auto-notified and has 30 minutes to confirm
- **2.2.8** Walk-in check-in: RSO uses the staff app to check in a walk-in shooter — creates a booking on-the-spot with status CONFIRMED, assigns available lane
- **2.2.9** Booking QR code: on booking creation, generate a QR code encoding `bookingReference` — returned in API response and emailed as PDF attachment; RSO scans at the gate

### 2.3 — Membership & Access System

**New Prisma models**: `MembershipTier`, `MembershipSubscription`, `MembershipCard`

- **2.3.1** `MembershipTier` model (range-owned): `name` (e.g., "Annual Member"), `description`, `price`, `billingPeriod` (MONTHLY / ANNUAL / ONE_TIME), `maxBookingsPerMonth`, `laneDiscountPct`, `coachingDiscountPct`, `guestPassesPerMonth`, `canBookAdvancedDays` (how many days ahead)
- **2.3.2** `MembershipSubscription` model: `userId`, `tierId`, `rangeId`, `status` (ACTIVE / GRACE / SUSPENDED / CANCELLED / EXPIRED), `currentPeriodStart`, `currentPeriodEnd`, `stripeSubscriptionId` (nullable), `autoRenew` (bool)
- **2.3.3** Member dashboard widget: prominently shows membership tier, expiry date, remaining bookings this month, guest passes balance
- **2.3.4** Digital membership card API: `GET /membership/card` returns a signed URL to a dynamically generated membership card image (QR code + name + tier + expiry) — rendered as a full-screen display on mobile
- **2.3.5** Membership expiry workflow: cron job runs nightly — 30-day warning email, 7-day warning push notification, 1-day warning SMS; on expiry, status → EXPIRED, booking capability suspended; 7-day grace period for renewal
- **2.3.6** Guest pass management: `POST /membership/guest-passes/issue` — member issues a day pass to a guest (by email); guest gets an email with QR code; pass tied to a specific date
- **2.3.7** Access validation endpoint: `GET /ranges/:id/validate-access?userId=X` — returns `{ allowed: boolean, tier: string, reason: string }` — range turnstile hardware polls this
- **2.3.8** Corporate/team accounts: `Organization` model — one billing entity, multiple `userId` linked; one invoice for all; admin manages member list

### 2.4 — Environmental Data System

- **2.4.1** Real weather integration: on session start at a range with GPS coordinates, auto-call OpenMeteo API (free tier, no key needed) — store `temperature`, `humidity`, `windSpeed`, `windDirection`, `pressure`, `visibility` in `SessionContext`
- **2.4.2** Weather API service: `WeatherService` in NestJS — caches range weather every 15 minutes per range (not per session) in Redis to avoid API spam
- **2.4.3** Environmental log API: `GET /ranges/:id/environment-log?from=2026-08-01&to=2026-09-01` returns actual stored weather readings (currently the UI shows hardcoded mock data)
- **2.4.4** Wind-score correlation chart: analytics endpoint that returns a scatter chart dataset: x-axis = wind speed, y-axis = avg session score, one point per session at that range — shows how wind affects performance at this specific location
- **2.4.5** Weather forecast card: range dashboard shows today's forecast for the range location — helps shooters and staff decide whether to open outdoor bays

### 2.5 — Range Operations Dashboard

- **2.5.1** Operator home screen: KPI cards — active sessions right now, lanes in use / total, bookings today, members checked in today, monthly revenue, total active members
- **2.5.2** Hourly utilization chart: bar chart of lane-hours used per hour of day, averaged over last 30 days — identifies peak hours for staffing decisions
- **2.5.3** Day-of-week heatmap: 7×24 grid showing average lane utilization by hour × day — helps identify underutilized slots for discounted pricing
- **2.5.4** Member retention table: list of members not seen in 30 / 60 / 90 days with "Send re-engagement email" action button
- **2.5.5** Revenue breakdown chart: pie or bar chart splitting revenue by source (memberships, day passes, lane fees, coaching fees)
- **2.5.6** Upcoming closures & maintenance calendar: range operator posts scheduled closures; visible to all members on their dashboard and calendar

### 2.6 — Range Configuration & Setup

- **2.6.1** Multi-range support: one account can manage multiple range locations (main range + a secondary indoor range across town) — all under one operator dashboard
- **2.6.2** Operating hours manager: per-day-of-week + holiday schedule editor in the web UI — feeds into slot generation
- **2.6.3** Range rules document: rich-text editor for the range's standing orders, safety rules, code of conduct — rendered to members on first booking and accessible via a persistent "Range Rules" link
- **2.6.4** RSO shift assignment: `Shift` model — `rsoUserId`, `date`, `startTime`, `endTime`, `rangeId` — displayed on member-facing check-in screen ("Today's RSO: [Name] — [Phone]")
- **2.6.5** Range closure announcements: `POST /ranges/:id/announcements` — broadcasts a closure or special notice as a push notification to all members of that range + a banner on their dashboard

---

## CATEGORY 3: PLAYER / SHOOTER MODULE ENHANCEMENT

### 3.1 — Comprehensive Athlete Profile

**Extend `ShooterProfile` and add `AthleteDetails` model**

- **3.1.1** Extended profile fields: `dateOfBirth` (date — for age category calculation), `gender` (enum: MALE / FEMALE / NON_BINARY / PREFER_NOT_TO_SAY), `dominantHand` (enum: LEFT / RIGHT / AMBIDEXTROUS), `eyeDominance` (LEFT / RIGHT), `stance` (enum: STANDING / PRONE / KNEELING / BENCHREST), `nationality` (ISO country code), `homeRangeId` (FK → RangeLocation), `profilePhotoUrl` (S3 URL)
- **3.1.2** Physical attributes: `heightCm` (int), `weightKg` (decimal), `wingstpanCm` (int) — relevant for stance biomechanics in AI coaching
- **3.1.3** Contact and emergency: `phone` (string, E.164 format), `emergencyContactName` (string), `emergencyContactPhone` (string), `emergencyContactRelation` (string)
- **3.1.4** Medical notes: separate `MedicalNote` model with `coachOnly: true` flag — only the managing coach can read/write; never returned to the shooter or third parties. Fields: `conditions`, `medications`, `restrictions`, `lastUpdated`
- **3.1.5** Profile completeness score: API returns a `profileCompleteness` percentage (0–100) based on how many optional fields are filled — shown as a progress bar with "Complete your profile" nudge

### 3.2 — License & Certification Management

**New Prisma model**: `License`, `Certification`

- **3.2.1** `License` model: `userId`, `type` (enum: NRAI / NRA / IPSC / USPSA / CMP / STATE / OTHER), `licenseNumber` (string), `issuedBy` (string), `issuedDate` (date), `expiryDate` (date), `documentUrl` (S3 URL — encrypted), `status` (VALID / EXPIRING_SOON / EXPIRED)
- **3.2.2** License expiry tracking: cron job checks all licenses daily; updates `status`; sends email/push 60, 30, 7 days before expiry
- **3.2.3** `Certification` model: `userId`, `name` (e.g., "Level 2 Safety Certified"), `issuedBy`, `issuedDate`, `expiryDate` (nullable — some don't expire), `documentUrl`
- **3.2.4** Background check status field: `backgroundCheckStatus` on ShooterProfile: PENDING / CLEARED / FLAGGED / NOT_REQUIRED — range admin sets this; affects booking permissions
- **3.2.5** Competition eligibility checker: `GET /shooters/:id/competition-eligibility?eventId=X` — returns a JSON report: `{ eligible: true, warnings: [], disqualifiers: [] }` based on license validity, age group, and category
- **3.2.6** Age category auto-calculation: derived from `dateOfBirth` at any given event date — U14, U17, U21, Senior, Master — never stored, always computed

### 3.3 — Personal Bests & Achievement System

**New Prisma models**: `PersonalBest`, `Achievement`, `AchievementEarned`

- **3.3.1** `PersonalBest` model: `shooterId`, `discipline` (string), `distance` (int), `weaponType` (string), `score` (decimal), `sessionId` (FK), `achievedAt` (datetime) — composite unique index on `(shooterId, discipline, distance, weaponType)`
- **3.3.2** PB update trigger: after every `POST /shots` batch, trigger an async check — if the session average exceeds the stored PB for that discipline+distance+weapon, update the PB record and emit a `pb:updated` WebSocket event
- **3.3.3** PB display: prominent PB card on shooter dashboard showing all-time best per their top 3 discipline+weapon combos, with the date achieved and sparkline of recent approach to PB
- **3.3.4** Achievement definitions (hardcoded catalog): 30+ achievements covering: first session, first X-ring, 100 sessions milestone, 1000 shots milestone, 10 consecutive days training, avg score ≥ 9.5 in a single session, <0.5 std dev session, win competition, personal best broken, consistency king (10 sessions with avg within 0.2 of each other)
- **3.3.5** Achievement checking service: runs after every session completion — evaluates all unchecked achievement conditions for that shooter — awards and persists newly earned achievements
- **3.3.6** Achievement notification: WebSocket `achievement:earned` event fires immediately; push notification sent if app is in background; in-app "🏆 Achievement Unlocked" animation shown
- **3.3.7** Achievement showcase: visible on shooter public profile (if profile is set to public) and in coach's shooter summary view

### 3.4 — Internal Ranking System

**New Prisma models**: `RangeRanking`, `RankHistory`

- **3.4.1** Ranking algorithm: ELO-style rating updated after every session at a specific range. Rating formula: `newRating = oldRating + K × (actualScore - expectedScore)` where `expectedScore` is derived from the shooter's percentile within the range. K-factor = 32 for new shooters (<20 sessions), 16 for established
- **3.4.2** Separate rankings per: discipline, distance, weapon type — a shooter can be ranked #3 in 10m Air Rifle and #12 in 25m Pistol at the same range
- **3.4.3** `GET /ranges/:id/leaderboard?discipline=10m+Air+Rifle&limit=20` — public endpoint (no auth required) — returns top N shooters with their rating, sessions count, and best score (name anonymized to first name + last initial unless shooter has set `profileIsPublic: true`)
- **3.4.4** Rank history chart: line chart of a shooter's ranking position over the past 90 days — visible on their own dashboard
- **3.4.5** Rank change notifications: "You moved from #8 to #5 in 10m Air Rifle at [Range Name]!"

### 3.5 — Training Streak & Goal Tracking

- **3.5.1** Training streak: calculated from `Session.sessionDate` — current consecutive days with at least one session (calendar days, not 24-hr periods). Stored as `currentStreak` and `longestStreak` on ShooterProfile, updated after every session creation
- **3.5.2** Goal setting: `TrainingGoal` model — `shooterId`, `discipline`, `distance`, `weaponType`, `targetScore` (decimal), `targetDate` (date), `status` (ACTIVE / ACHIEVED / ABANDONED), `createdAt`
- **3.5.3** Goal progress widget: on dashboard, shows a progress bar from baseline (score when goal was set) to target score, with current average. Shows estimated completion date based on rate of improvement
- **3.5.4** Goal achievement celebration: when a session average exceeds the `targetScore`, mark goal as ACHIEVED and trigger achievement + notification
- **3.5.5** Coach goal visibility: coaches can view and comment on their shooters' active goals. Coaches can suggest goal modifications

### 3.6 — Session Journal (Subjective Notes)

- **3.6.1** `SessionJournal` model: `sessionId`, `shooterId`, `perceivedPerformance` (1–5 stars), `focus` (1–5 stars), `energy` (1–5 stars), `notes` (text, max 2000), `createdAt` — entirely shooter-private (coach cannot see unless shooter shares)
- **3.6.2** Journal vs. AI comparison: the AI coach analysis is shown alongside the shooter's self-assessment — compare perceived vs. actual performance
- **3.6.3** Mood/energy trend chart: plot the shooter's self-reported focus and energy ratings over time, overlaid with actual average score — identify if self-perception aligns with performance

---

## CATEGORY 4: COACH MODULE ENHANCEMENT

### 4.1 — Coach Profile & Credentials

- **4.1.1** Extend User/coach profile: `CoachProfile` model — `userId`, `bio` (rich text, max 2000), `specializations` (string[]: disciplines they coach), `certifications` (string[]), `yearsExperience` (int), `hourlyRate` (decimal, optional), `availabilityNotes` (string), `profilePhotoUrl`, `linkedInUrl`, `websiteUrl`, `isPubliclyListable` (bool — whether searchable by shooters)
- **4.1.2** Coach public directory: `GET /coaches/directory?discipline=10m+Air+Rifle&location=Mumbai` — returns publicly listed coaches with their profile. Shooters can find and send connection requests directly from the directory
- **4.1.3** Certification badge display: verified certifications (NRAI, NRA, ISSF) shown with a checkmark badge on the coach's public profile after admin verification
- **4.1.4** Availability calendar: coach sets their available hours per week using a weekly schedule editor; shooters see this on the coach profile before sending a session request

### 4.2 — Squad / Team Management

**New Prisma models**: `Squad`, `SquadMember`

- **4.2.1** `Squad` model: `coachId`, `name` (e.g., "Junior National Team 2026"), `description`, `discipline`, `targetCompetition`, `createdAt`
- **4.2.2** `SquadMember` model: `squadId`, `shooterId`, `joinedAt`, `role` (CAPTAIN / MEMBER)
- **4.2.3** Squad management API: CRUD for squads; `POST /coach/squads/:id/members` to add shooter; `GET /coach/squads/:id/performance` — aggregate stats for all members
- **4.2.4** Squad comparative table: sortable table showing all squad members side-by-side — columns: name, avg score (last 30d), best score, group radius, consistency, sessions logged, last active date
- **4.2.5** Squad training event: when creating a `TrainingEvent`, coach can assign it to an entire squad (auto-assigns all squad members as `EventAssignee`)
- **4.2.6** Squad leaderboard: real-time ranking within the squad, updated after every squad member's session

### 4.3 — Group Session Management

- **4.3.1** `GroupSession` model: `coachId`, `squadId` (optional), `rangeId`, `sessionDate`, `discipline`, `distance`, `weaponType`, `notes`, `participantIds` (string[])
- **4.3.2** When a coach creates a group session, the system creates individual `Session` records for each participant — all linked to the `GroupSession` via `groupSessionId` FK
- **4.3.3** Group session view: coach sees a split-panel or card grid showing each shooter's live shot feed simultaneously during the session
- **4.3.4** Bulk AI analysis: `POST /coach/group-sessions/:id/analyze` — runs AI coach analysis for each participant and returns a combined report with cross-shooter comparisons
- **4.3.5** Group session feedback: coach can write one feedback block and post it to all, or write individual feedback to each shooter from one screen

### 4.4 — Drill Library

**New Prisma models**: `Drill`, `DrillCategory`

- **4.4.1** `Drill` model: `coachId`, `name`, `description` (rich text), `category` (enum: POSITIONING / BREATHING / TRIGGER / FOCUS / ENDURANCE / WARM_UP / COOL_DOWN), `discipline` (string), `duration` (minutes), `sets` (int), `shots` (int), `restMinutes` (int), `difficultyLevel` (enum: BEGINNER / INTERMEDIATE / ADVANCED / ELITE), `videoUrl` (optional), `isPublic` (bool — whether visible to other coaches)
- **4.4.2** Drill assignment: drills can be assigned to a `TrainingEvent` (many-to-many `TrainingEventDrill` junction) — replaces the free-text "notes" field for structured training plans
- **4.4.3** Drill library browsing: coaches see their own drills + public drills created by others. Filter by category, discipline, difficulty. Clone a public drill to customize it
- **4.4.4** Drill completion tracking: after a training event, shooter can mark each drill as COMPLETED / PARTIAL / SKIPPED with a note — feeds back into the AI training plan effectiveness analysis

### 4.5 — Training Plan Templates

- **4.5.1** `TrainingPlanTemplate` model: `coachId`, `name`, `description`, `targetDiscipline`, `durationWeeks`, `difficultyLevel`, `isPublic` (bool), `planContent` (JSON — same schema as `TrainingPlan.content`)
- **4.5.2** Template creation UI: coach can save any AI-generated training plan as a template, or build one from scratch using the drill library
- **4.5.3** Template assignment: `POST /coach/shooters/:id/assign-template` — selects a template, chooses a start date, and the system auto-creates all `TrainingEvent` records on the shooter's calendar
- **4.5.4** Template library: public templates browsable by all coaches (filtered by discipline, difficulty, duration) — like a community resource

### 4.6 — Live Session Monitoring Enhancements

- **4.6.1** Multi-shooter live view: coach opens `/live-analysis/coach` and sees a 2×3 or 3×3 grid of live shot feeds for all their shooters who are currently in an active session. Each cell shows: shooter name, current shot count, running average, mini target canvas with live shots
- **4.6.2** "Pause & Correct" signal: coach clicks a button on a specific shooter's live card → `pause_signal` WebSocket event fired → shooter's app shows a full-screen amber banner "Your coach wants you to pause — check your device for instructions"
- **4.6.3** Live voice annotation: coach records a voice memo (up to 60 seconds) via the web app microphone; audio uploaded to S3; `voice_feedback` WebSocket event fires with the URL; shooter's app shows a playable audio bubble in the feedback panel
- **4.6.4** Post-shot auto-tip: configurable option per coach — after each shot is logged, if the shot score is below a threshold (e.g., < 9.0), auto-send a specific pre-written tip (selected from the drill library) to the shooter as a subtle in-session notification

### 4.7 — Reporting System

- **4.7.1** Shooter progress report: `GET /coach/shooters/:id/report?from=2026-08-01&to=2026-09-01&format=pdf` — generates a PDF containing: cover page with athlete info, executive summary, score trend line chart, ring distribution chart, shot heatmap, series consistency chart, AI performance assistant summary, coach notes, upcoming training events
- **4.7.2** Squad report: same structure but aggregated for all squad members — plus a comparative section ranking squad members on key metrics
- **4.7.3** Competition readiness report: generated 7 days before a competition event — compares the shooter's recent average and consistency against the expected competition score requirements (stored in the competition record), plus AI readiness score and recommendations
- **4.7.4** Parent/Guardian report: separate template with plain English (no jargon) — "Maya trained 8 times this month. Her average score improved from 8.2 to 8.7. She earned 2 new badges. Her coach says: [coaching note]."
- **4.7.5** Report scheduling: coach can schedule weekly or monthly reports to be automatically emailed to a shooter (or their parent/guardian email for juniors)

### 4.8 — Coach Communication Hub

- **4.8.1** `Message` model: `fromUserId`, `toUserId`, `threadId` (groups messages in a conversation), `content` (text, max 2000), `attachmentUrl` (optional S3 URL), `readAt` (nullable datetime), `createdAt` — NOT a real-time chat — async like email threads
- **4.8.2** Message threads API: `GET /messages/threads` (list conversations), `GET /messages/threads/:threadId` (load messages in thread), `POST /messages` (send new message or reply), `PATCH /messages/:id/read` (mark as read)
- **4.8.3** Broadcast announcement: `POST /coach/announcements` — coach sends a message to all connected shooters (or a specific squad) simultaneously. Stored as individual `Message` records to each recipient
- **4.8.4** Feedback templates: `CoachFeedbackTemplate` model — coach saves reusable feedback snippets with a label (e.g., "Left pull correction"). In the feedback form, a "Templates" dropdown inserts the selected snippet into the text box
- **4.8.5** Goal collaboration: shooter and coach can jointly set a `TrainingGoal` — coach has write access to goals for their managed/connected shooters; `goalComment` field for coach to annotate progress

---

## CATEGORY 5: COMPETITION & TOURNAMENT MANAGEMENT

*Currently `COMPETITION` is just a calendar event type — no backend logic*

### 5.1 — Competition Setup

**New Prisma models**: `Competition`, `CompetitionCategory`, `CompetitionEntry`, `CompetitionResult`

- **5.1.1** `Competition` model: `rangeId` (where it's hosted), `organizingCoachId` (or rangeAdminId), `name`, `description`, `startDate`, `endDate`, `venue`, `address`, `discipline` (string[]), `federationApprovalNumber` (optional), `entryDeadline`, `maxParticipants`, `registrationFee` (decimal), `status` (enum: DRAFT / OPEN / CLOSED / IN_PROGRESS / COMPLETED / CANCELLED)
- **5.1.2** `CompetitionCategory` model: `competitionId`, `name` (e.g., "Senior Men 10m Air Rifle"), `discipline`, `distance`, `weaponType`, `ageGroupMin` (int, nullable), `ageGroupMax` (int, nullable), `gender` (nullable), `maxEntries` (int)
- **5.1.3** `CompetitionEntry` model: `competitionId`, `categoryId`, `shooterId`, `enteredByCoachId` (nullable — coach entering on behalf), `paymentStatus` (PENDING / PAID / WAIVED), `paymentId`, `status` (ENTERED / CONFIRMED / WITHDRAWN / DISQUALIFIED), `enteredAt`
- **5.1.4** Competition entry flow: shooter browses open competitions at their range → selects category (eligibility auto-checked) → pays entry fee (if required) → confirmation email with entry details
- **5.1.5** Coach batch entry: coach can enter all squad members into a competition from one screen — individual payment links sent to each shooter (or coach pays for all)
- **5.1.6** Entry list management: competition organizer sees all entries with payment status; can add/remove entries; export entry list as PDF or CSV

### 5.2 — Live Scoring System

**New Prisma models**: `CompetitionSession`, `CompetitionScore`, `ScoreboardEntry`

- **5.2.1** `CompetitionSession` model: links a `Session` to a `CompetitionEntry` — adds `round` (int: qualification round 1, qualification round 2, finals), `timeStarted`, `timeEnded`, `officialScore` (decimal — may differ from raw sum due to ruleset)
- **5.2.2** Competition scoreboard endpoint: `GET /competitions/:id/scoreboard` — returns real-time rankings for each category. **No authentication required** — designed for public display on a TV/projector at the venue
- **5.2.3** Scoreboard WebSocket room: all connections to the scoreboard page join `competition:{id}:scoreboard` room; every shot logged for a participant in an active competition pushes a `score:updated` event to the room
- **5.2.4** Kiosk mode: `/competitions/:id/kiosk` — full-screen dark mode leaderboard with rank numbers, shooter names, scores, and series progress. Animated rank swaps. No browser chrome. Configurable to auto-scroll categories every 30 seconds
- **5.2.5** ISSF format enforcement: system validates shot count rules (e.g., 10m Air Rifle = 60 shots in 75 minutes; 50m 3P = 120 shots). If a session ends with fewer shots than required, mark it INCOMPLETE and alert the range officer
- **5.2.6** Finals mode: separate tracking for 8-shooter elimination finals. Alternating single-shot format. Each shot shown individually on a dedicated finals scoreboard view with animated progress bars
- **5.2.7** National record detection: store `NationalRecord` (discipline + category + record score + holder + year). When a competition score exceeds the stored record, display a banner on the scoreboard and send an alert to the organizer

### 5.3 — Post-Competition Analytics

- **5.3.1** Competition vs. training delta: `GET /competitions/:entryId/vs-training` — compares the shooter's official competition series-by-series against their 5 most recent training sessions. Returns a delta chart dataset showing where the shooter under/over-performed relative to training baseline
- **5.3.2** Pressure performance index: calculated when ≥3 competition entries exist — ratio of (competition average / training average) × 100. Score < 95 = significant performance drop under competition pressure; flagged in AI analysis as "competition nerves"
- **5.3.3** Competition history timeline: on shooter profile, a visual timeline of all competitions entered — card per competition showing placement, score, category, date
- **5.3.4** Medal tracking: `CompetitionResult` model stores `placement` (int), `medal` (enum: GOLD / SILVER / BRONZE / NONE), `score`, `certificateUrl`. Medal count prominently displayed on athlete profile
- **5.3.5** Head-to-head replay: competitor comparison tool — select two shooters from the same competition, compare shot-by-shot in a side-by-side animated replay on the target canvas

---

## CATEGORY 6: EQUIPMENT & ARMORY MODULE

### 6.1 — Weapon Registry (Full)

**Extend existing `Equipment` model significantly**

- **6.1.1** Full weapon fields: `make` (string), `model` (string), `serialNumber` (string, unique per user), `caliber` (string), `actionType` (enum: BOLT / SEMI_AUTO / SINGLE_SHOT / LEVER / REVOLVER / OTHER), `barrelLengthMm` (int), `weightGrams` (int), `stockType` (string), `finishColor` (string), `purchaseDate` (date), `purchasePrice` (decimal), `dealerName` (string), `proofOfPurchaseUrl` (S3), `registrationNumber` (string), `registrationExpiryDate` (date), `licenceId` (FK → License — which license covers this weapon), `isActive` (bool), `isLoanerWeapon` (bool — for range loaners), `loanedToUserId` (nullable FK)
- **6.1.2** `Optic` model (sub-record of Equipment): `equipmentId` (FK), `brand`, `model`, `magnification` (string: "4-16x"), `tubeSize` (int: 30mm, 34mm, 1"), `moaPerClick` (decimal), `firstFocalPlane` (bool), `purchaseDate`, `currentClickSettings` (JSON: {elevation: int, windage: int})
- **6.1.3** Service log: `EquipmentServiceLog` model — `equipmentId`, `serviceDate`, `roundsSinceLast` (int), `workPerformed` (text), `partsReplaced` (string[]), `cost` (decimal), `technicianName`, `nextServiceDue` (date)
- **6.1.4** Rounds counter: `totalRoundsFired` (int) on Equipment — incremented by the sum of shots in each session that used this weapon (derived from `Session.weaponType` matching `Equipment.model`)
- **6.1.5** Service reminder: cron job — if `totalRoundsFired` exceeds `nextServiceAtRounds` OR `serviceDate` + 12 months has passed → push notification "Your [weapon name] is due for service"
- **6.1.6** Weapon accuracy baseline: `AccuracyBaseline` model — `equipmentId`, `baselineDate`, `distance` (int), `group3ShotMm` (decimal), `group5ShotMm` (decimal), `velocity` (decimal, fpm) — captured after bore-sighting, used as reference for detecting degraded accuracy over time

### 6.2 — Ammunition Tracking

**New Prisma models**: `AmmoInventory`, `AmmoLot`, `ReloadingLog`

- **6.2.1** `AmmoLot` model: `userId`, `brand`, `caliber`, `bulletWeightGrains` (decimal), `powderCharge` (decimal, nullable — for handloads), `lotNumber` (string), `quantity` (int), `unitCost` (decimal), `purchaseDate`, `isHandloaded` (bool), `notes`
- **6.2.2** Inventory deduction: on session completion, optionally log `shotsUsed` × `ammoLotId` → deducts from inventory quantity automatically
- **6.2.3** Lot performance correlation: `GET /ammo/lots/:id/performance` — returns aggregate analytics (avg score, avg group radius) for all sessions where this ammo lot was logged. Compare lots side-by-side
- **6.2.4** `ReloadingLog` model (for hand-loaders): `userId`, `date`, `caliber`, `primer` (brand + model), `powder` (brand + model + chargeGrains), `bulletMake` (brand + model + weightGrains), `seatDepthMm` (decimal), `oalMm` (decimal), `quantityLoaded` (int), `notes`, `linkedAmmoLotId` (FK → AmmoLot — creates inventory entry)
- **6.2.5** Ammo planner: `GET /ammo/planner?weeks=4` — looks at the shooter's upcoming training schedule, estimates rounds needed based on historical sessions-per-week and shots-per-session, compares against current inventory, shows "You need X more rounds. At current rate you will run out in Y days."

### 6.3 — Ballistics Enhancement

- **6.3.1** Save ballistic profiles: each calculation result can be saved as a named profile (e.g., "Match Load — 175gr SMK @ 100m"), stored in `BallisticProfile` model
- **6.3.2** Trajectory chart: `GET /ballistics/:id/chart` returns trajectory data as a JSON array `[{distanceYards, dropInches, windDriftInches, velocity, energy}]` — plotted as a line chart in the UI
- **6.3.3** Multi-load comparison: select 2–3 saved ballistic profiles, render their trajectory curves on one chart — compare drop, wind drift, and retained energy
- **6.3.4** DOPE card generator: `GET /ballistics/:id/dope-card?format=pdf` — generates a printable waterproof-ready card with holdover/correction table per 25-yard increment out to 1000 yards
- **6.3.5** Chronograph data import: `POST /equipment/:id/velocity-readings` — enter measured muzzle velocity from a chronograph; improves ballistic calculation accuracy vs. manufacturer-specified velocity
- **6.3.6** G7 BC support: extend current calculator to support both G1 and G7 ballistic coefficients; add BC format selector in the UI

### 6.4 — Range Inventory (Range-Owned Assets)

- **6.4.1** Range target inventory: `RangeInventory` model — `rangeId`, `itemType` (enum: PAPER_TARGET / BACKER / TARGET_FRAME / EAR_PROTECTION / EYE_PROTECTION / FIRST_AID / CLEANING_SUPPLIES / OTHER), `itemName`, `quantity`, `minReorderQuantity`, `supplierName`, `supplierContact`, `lastRestockedAt`
- **6.4.2** Low-inventory alert: cron job checks daily — if `quantity` ≤ `minReorderQuantity`, email/push to RANGE_ADMIN ("Low inventory: Paper targets down to 120 units. Reorder threshold: 200.")
- **6.4.3** Loaner equipment tracking: if `isLoanerWeapon: true` on an Equipment record — track current loan via `loanedToUserId` and `loanedAt`. Staff app shows all active loans with overdue flags

---

## CATEGORY 7: SAFETY & COMPLIANCE MODULE

### 7.1 — Safety Rules Engine

- **7.1.1** `RangeSafetyRule` model: `rangeId`, `order` (int — display order), `title`, `description`, `category` (enum: PPE / MUZZLE_DISCIPLINE / AMMUNITION / CONDUCT / MEDICAL / EMERGENCY), `isMandatory` (bool)
- **7.1.2** Safety acknowledgment: `SafetyAcknowledgment` model — `userId`, `rangeId`, `acknowledgedAt`, `version` (int — rules version at time of acknowledgment). First-time visitors to a range must read and e-sign the rules before booking or checking in
- **7.1.3** Safety quiz: `SafetyQuiz` model — multiple-choice questions tied to a range's rules. `QuizAttempt` model tracks attempts, score (must score ≥ 80%), timestamp. Failed attempts blocked for 1 hour
- **7.1.4** RSO assignment per session: `rsoOnDutyId` FK on session check-in record — tracks which RSO was on duty when a shooter was on the range
- **7.1.5** Cold range / hot range status: `RangeLocation.rangeStatus` field (HOT / COLD / CLOSED) — staff toggles; change broadcasts a WebSocket event to all connected shooters with a loud UI alert ("⚠️ RANGE GOING COLD — UNLOAD AND TABLE YOUR FIREARMS")

### 7.2 — Incident Reporting System

**New Prisma models**: `IncidentReport`, `IncidentPhoto`, `CorrectiveAction`

- **7.2.1** `IncidentReport` model: `rangeId`, `reporterId` (FK → User), `incidentDate`, `incidentTime`, `laneId` (nullable FK), `type` (enum: NEGLIGENT_DISCHARGE / INJURY / PROPERTY_DAMAGE / EQUIPMENT_FAILURE / NEAR_MISS / RULE_VIOLATION / OTHER), `severity` (enum: MINOR / MODERATE / SERIOUS / CRITICAL), `description` (text), `personsInvolved` (string[]), `witnesses` (string[]), `firstAidProvided` (bool), `emergencyServicesContacted` (bool), `status` (OPEN / UNDER_INVESTIGATION / RESOLVED), `resolvedAt` (nullable), `requiresExternalReport` (bool)
- **7.2.2** Incident report API: any authenticated user at the range can file `POST /incidents` — RSO and RANGE_ADMIN get immediate push notification for severity SERIOUS and CRITICAL
- **7.2.3** Photo uploads: `POST /incidents/:id/photos` — up to 10 photos per incident, stored in S3 under an encrypted prefix, accessible only to RANGE_ADMIN and RSO
- **7.2.4** Corrective action tracking: `CorrectiveAction` model — `incidentId`, `description`, `assignedToUserId`, `dueDate`, `status` (OPEN / IN_PROGRESS / COMPLETED), `completedAt`
- **7.2.5** Incident dashboard: RANGE_ADMIN sees all incidents with filters (severity, type, date range, status). Export to Excel for regulatory submission
- **7.2.6** Regulatory report flag: `POST /incidents/:id/flag-regulatory` — marks incident as requiring external report submission; tracks `submittedAt` and `confirmationNumber`

### 7.3 — Compliance & Audit Trail

- **7.3.1** `AuditLog` model (append-only): `userId`, `action` (string — e.g., "MEMBERSHIP_CREATED", "INCIDENT_FILED"), `resourceType`, `resourceId`, `before` (JSON), `after` (JSON), `ipAddress`, `userAgent`, `timestamp`. NEVER updated or deleted — only inserted
- **7.3.2** Immutable audit middleware: NestJS interceptor that fires on every mutating request (POST, PATCH, PUT, DELETE) for sensitive models — writes to `AuditLog` automatically
- **7.3.3** GDPR data export: `GET /users/me/data-export` — async job generates a ZIP archive containing all the user's data (sessions, shots, profile, messages, bookings) as JSON + CSV, emails a download link within 24 hours
- **7.3.4** GDPR deletion request: `DELETE /users/me` — triggers a deletion workflow: anonymizes personal data (name → "Deleted User", email → hashed stub), soft-deletes account, retains anonymized session data for range analytics (legal basis: legitimate interest), deletes identifying data
- **7.3.5** Data retention policy: configurable per range — `dataRetentionYears` on `RangeLocation`. Cron job runs monthly, hard-deletes session data older than the policy period
- **7.3.6** Age verification for minors: if `dateOfBirth` indicates U18, profile requires `parentalConsentDocumentUrl` before booking access is granted. Document verified by RANGE_ADMIN

### 7.4 — First Aid & Emergency Protocols

- **7.4.1** `FirstAidKit` model: `rangeId`, `location` (string — e.g., "Reception desk"), `lastInspectedAt`, `nextInspectionDue`, `inspectorId`, `contents` (JSON array of items with quantities and expiry dates)
- **7.4.2** AED location registry: stored on `RangeLocation` as `aedLocations` (JSON array with location description). Displayed prominently on check-in screen and range dashboard
- **7.4.3** Emergency protocol quick-access: a floating "🆘 Emergency" button on the RSO/STAFF dashboard opens a full-screen step-by-step emergency procedure checklist — steps can be ticked off during the event for documentation purposes

---

## CATEGORY 8: FINANCIAL & BILLING MODULE

### 8.1 — Payment Gateway Integration

- **8.1.1** Stripe integration: install `stripe` npm package; configure `StripeModule` with `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` environment variables
- **8.1.2** Razorpay integration (for Indian rupee transactions): install `razorpay` package; configure `RazorpayModule` — supports UPI, NEFT, credit/debit cards natively
- **8.1.3** Unified `PaymentService` facade: internally routes to Stripe (for USD/international) or Razorpay (for INR) based on the user's billing currency preference — calling code doesn't need to know which gateway is used
- **8.1.4** `Payment` model: `userId`, `type` (enum: MEMBERSHIP / BOOKING / COACHING_PACKAGE / COMPETITION_ENTRY / DAY_PASS), `amount` (decimal), `currency` (string), `gateway` (STRIPE / RAZORPAY), `gatewayPaymentId`, `status` (PENDING / COMPLETED / FAILED / REFUNDED / PARTIALLY_REFUNDED), `refundedAmount` (decimal), `invoiceUrl` (S3), `createdAt`, `completedAt`
- **8.1.5** Webhook handlers: `/webhooks/stripe` and `/webhooks/razorpay` — process payment completion/failure events asynchronously and update Payment records. Webhook signatures verified before processing
- **8.1.6** Invoice generation: on payment completion, auto-generate a PDF invoice using `pdf-lib` or `pdfkit` — include range logo, receipt number, line items, tax (GST breakdown for India), payment method. Upload to S3 and email to customer

### 8.2 — Subscription Billing

- **8.2.1** Stripe subscriptions for monthly/annual memberships: on `POST /membership/subscribe`, create a Stripe Customer + Subscription (or Razorpay subscription) — store `stripeCustomerId` and `stripeSubscriptionId` on the user record
- **8.2.2** Auto-renewal: Stripe/Razorpay handles recurring billing. On `invoice.payment_succeeded` webhook, update `MembershipSubscription.currentPeriodEnd` and send receipt email
- **8.2.3** Failed payment grace period: on `invoice.payment_failed` webhook — status → GRACE, send "Payment failed" email with direct payment link; retry after 3 days; after 7 days of non-payment → SUSPENDED
- **8.2.4** Promo code system: `PromoCode` model — `code` (unique string), `discountType` (PERCENTAGE / FIXED), `discountValue`, `applicableTo` (MEMBERSHIP / BOOKING / ALL), `maxUses` (nullable), `usedCount`, `validFrom`, `validUntil`. Applied at checkout, discount reflected in the Stripe `coupon` object

### 8.3 — Coaching Package Billing

- **8.3.1** `CoachingPackage` model: `coachId`, `name`, `description`, `sessionCount` (int), `price` (decimal), `currency`, `validityDays` (int — package must be used within X days of purchase), `isActive` (bool)
- **8.3.2** `CoachingPackagePurchase` model: `shooterId`, `coachId`, `packageId`, `sessionsRemaining` (int), `purchasedAt`, `expiresAt`, `paymentId` (FK)
- **8.3.3** Session deduction: when a coach logs a coaching session with a shooter who has an active package, optionally deduct 1 session from `sessionsRemaining`
- **8.3.4** Package purchase flow: shooter browses coach's package offerings, pays via Stripe/Razorpay, receives purchase confirmation with session count. Coach gets notification of new package purchase

### 8.4 — Financial Dashboard (Range Admin)

- **8.4.1** Revenue summary: daily, weekly, monthly, annual revenue totals — displayed as KPI cards with trend % vs. previous period
- **8.4.2** Revenue breakdown chart: stacked bar chart — memberships, day passes, lane bookings, competition entries, coaching commissions (if range takes a %) — monthly view
- **8.4.3** Payment ledger: searchable/filterable table of all payments — filter by type, date range, status. Export to CSV or Excel
- **8.4.4** Unpaid dues: list of members with failed payments or suspended subscriptions — with "Send payment link" and "Suspend access" action buttons
- **8.4.5** Tax report: `GET /admin/finance/tax-report?year=2026` — generates GST (or appropriate tax) summary report with GSTIN, HSN codes, total taxable amount, tax collected — exportable as Excel for accountant use

---

## CATEGORY 9: NOTIFICATION & COMMUNICATION SYSTEM

### 9.1 — In-App Notification Center

- **9.1.1** `Notification` model: `userId`, `type` (enum: 40+ types — see below), `title`, `body`, `actionUrl` (nullable — deep link within app), `isRead` (bool), `readAt` (nullable), `createdAt`, `expiresAt` (nullable — some notifications auto-delete after 7 days)
- **9.1.2** Notification type enum (comprehensive): SESSION_FEEDBACK_RECEIVED, CONNECTION_REQUEST_RECEIVED, CONNECTION_APPROVED, CONNECTION_REJECTED, INVITE_RECEIVED, INVITE_APPROVED, ACHIEVEMENT_EARNED, PERSONAL_BEST_BROKEN, RANK_CHANGED, MEMBERSHIP_EXPIRING, MEMBERSHIP_EXPIRED, MEMBERSHIP_RENEWED, BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_REMINDER, LANE_ASSIGNED, WAITLIST_POSITION_AVAILABLE, COMPETITION_ENTRY_CONFIRMED, COMPETITION_STARTING_SOON, AI_ANALYSIS_COMPLETE, TRAINING_PLAN_GENERATED, SCHEDULE_REQUEST_RESPONSE, COACH_ANNOUNCEMENT, GOAL_ACHIEVED, TRAINING_EVENT_REMINDER, SQUAD_ADDED, PAYMENT_RECEIVED, PAYMENT_FAILED, LICENSE_EXPIRING, CERT_EXPIRING, INCIDENT_FILED (RSO), RANGE_CLOSURE_ANNOUNCED, COLD_RANGE_ALERT, VOICE_FEEDBACK_RECEIVED, PAUSE_SIGNAL_RECEIVED
- **9.1.3** Notification API: `GET /notifications` (paginated, unread first), `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`
- **9.1.4** Notification bell UI: TopBar bell icon with red badge showing unread count — clicking opens a slide-in notification panel with infinite scroll
- **9.1.5** Notification preferences: `NotificationPreference` model — per `type`, user can set `inApp: bool`, `push: bool`, `email: bool`, `sms: bool` independently
- **9.1.6** Real-time delivery: new notifications push via the existing WebSocket gateway as `notification:new` events — `unreadCount` also pushed so the bell badge updates instantly

### 9.2 — Email Notifications

- **9.2.1** Install and configure Resend (or SendGrid) — add `RESEND_API_KEY` to `.env`; create `EmailService` NestJS service
- **9.2.2** Email templates (React Email or Mjml): booking confirmation (includes QR code image, event details, range rules link, calendar .ics attachment), membership renewal reminder, coach feedback received (includes the feedback text + link to session), competition entry confirmation, weekly performance digest, achievement earned (includes badge graphic), welcome email (onboarding checklist with 5 steps to get started)
- **9.2.3** Weekly performance digest: auto-generated Sunday evening — summary of the week's training: sessions count, total shots, avg score, best session, AI insight of the week, upcoming events next week. Opt-out available
- **9.2.4** Transactional email logs: all outbound emails logged to `EmailLog` model with delivery status (delivered, bounced, opened) — admin can resend or debug

### 9.3 — Push Notifications

- **9.3.1** Firebase Cloud Messaging (FCM): configure FCM for Web (service worker) and Android (via Capacitor Firebase Push plugin)
- **9.3.2** `DevicePushToken` model: `userId`, `token`, `platform` (WEB / ANDROID / IOS), `lastSeenAt` — tokens refreshed on app startup
- **9.3.3** `PushService`: sends FCM messages via the `firebase-admin` SDK. Falls back gracefully if token is stale (catches `messaging/registration-token-not-registered` and deletes the token)
- **9.3.4** Foreground vs. background: when app is in foreground, in-app notification panel is used; when in background, push notification shown in system notification tray with deep-link action

### 9.4 — SMS / WhatsApp

- **9.4.1** Twilio integration: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in `.env`. `SmsService` for SMS delivery
- **9.4.2** WhatsApp Business API (via Twilio): configure WhatsApp templates for booking confirmation and competition reminder — WhatsApp messages have >90% open rate vs. email's ~20% — critical for Indian user base
- **9.4.3** SMS use cases (time-sensitive only — not spammy): booking reminder 2 hours before slot, lane ready notification, cold range alert, competition starting in 30 minutes, payment failure

---

## CATEGORY 10: NEW USER ROLES & MULTI-TENANCY

### 10.1 — New Role: RANGE_ADMIN

- **10.1.1** Add `RANGE_ADMIN` to `UserRole` enum in `shared-types.ts` and update `RolesGuard` and JWT payload
- **10.1.2** RANGE_ADMIN permissions: full CRUD on RangeLocation, Lane, Booking, MembershipTier, RangeSafetyRule, Staff roster, IncidentReport, Announcement, RangeInventory, Competition (at their range)
- **10.1.3** RANGE_ADMIN can view (read-only) anonymized aggregate session analytics for their range (total sessions, avg scores by discipline, lane utilization) — NOT individual shooter performance data
- **10.1.4** RANGE_ADMIN dashboard: distinct dashboard layout with operational KPIs (not performance analytics) — see Category 2.5

### 10.2 — New Role: RSO (Range Safety Officer)

- **10.2.1** Add `RSO` to UserRole enum
- **10.2.2** RSO permissions: read all lane statuses, change lane status (OPEN / MAINTENANCE / CLOSED), check in walk-in shooters, file incident reports, verify safety acknowledgments, toggle range HOT/COLD status, view today's bookings and member profiles (name + photo + membership status only — not performance data)
- **10.2.3** RSO quick-access panel: mobile-first UI designed for tablet use at the range — large touch targets, quick lane status toggles, check-in scanner (camera QR reader), cold range button

### 10.3 — New Role: STAFF (Front Desk)

- **10.3.1** Add `STAFF` to UserRole enum
- **10.3.2** STAFF permissions: check in bookings (scan QR or lookup by name), sell day passes, process membership payments, view lane availability, assign loaner equipment, view contact info for current day's bookings
- **10.3.3** STAFF cannot access: performance data, incident reports, safety rule configuration, financial reports

### 10.4 — New Role: PARENT_GUARDIAN

- **10.4.1** Add `PARENT_GUARDIAN` to UserRole enum
- **10.4.2** PARENT_GUARDIAN is linked to one or more SHOOTER accounts (the `ParentalLink` model: `parentUserId`, `shooterUserId`, `consentSignedAt`, `consentDocumentUrl`)
- **10.4.3** PARENT_GUARDIAN dashboard: read-only simplified view — child's upcoming sessions, progress summary (plain English), recent achievements, coach's name, next competition
- **10.4.4** Parent notifications: can opt in to receive email summaries of their child's training sessions (weekly digest format)

### 10.5 — Club / Organization Model

- **10.5.1** `Organization` model: `name`, `type` (enum: CLUB / ACADEMY / NATIONAL_TEAM / POLICE_UNIT / MILITARY_UNIT / CORPORATE), `adminUserId`, `logoUrl`, `description`, `federationMemberNumber`
- **10.5.2** `OrganizationMember` model: `organizationId`, `userId`, `role` (ADMIN / COACH / ATHLETE / PARENT), `joinedAt`
- **10.5.3** Organization billing: one `StripeCustomerId` per organization — all members' memberships billed to the organization account; single monthly invoice
- **10.5.4** Cross-organization analytics: organizations that opt in can see anonymized benchmark scores from other organizations in the same federation — enables clubs to benchmark their athletes nationally

### 10.6 — SSO & Enterprise Auth

- **10.6.1** SAML 2.0 SSO: integrate `passport-saml` — allows national federations, military units, and police departments to authenticate with their own identity providers (Active Directory, Azure AD, Okta)
- **10.6.2** Refresh token rotation: add `RefreshToken` model — 30-day sliding refresh tokens stored as hashed values; rotate on every use; revoke on logout. Replace current session-less JWT approach for web
- **10.6.3** 2FA (TOTP): `POST /auth/2fa/setup` generates a TOTP secret and QR code; `POST /auth/2fa/verify` validates and enables; `POST /auth/2fa/disable` (requires password confirmation). RANGE_ADMIN and RSO roles have 2FA enforced
- **10.6.4** API keys for hardware integrations: `ApiKey` model — `userId`, `name`, `keyHash`, `lastUsedAt`, `scopes` (string[] — e.g., `["biometrics:write", "sessions:read"]`). Used by custom sensor hardware to call the biometrics API without a user JWT

---

## CATEGORY 11: AI & ANALYTICS ENHANCEMENTS

### 11.1 — AI Coach Improvements

- **11.1.1** Multi-session context window: currently `analyzeSession()` only sees 1 session. Add a "context brief" from the last 5 sessions (summary stats only, not full shot data) appended to the prompt — enables the AI to note trends ("This is the third consecutive session with right pull")
- **11.1.2** Conversational AI coach: `POST /ai-coach/chat` endpoint with `messages: [{role, content}]` array — persisted `AiChatThread` model (threadId, sessionId, messages JSON). Frontend renders as a chat UI. AI has access to the session data as context
- **11.1.3** Voice output: `GET /ai-coach/sessions/:id/analysis/audio` — calls a TTS API (ElevenLabs or Google TTS) with the AI coach text and returns an MP3 URL — enables hands-free feedback review at the range
- **11.1.4** Drill recommendation links: update AI system prompt to include instructions to output `drillId` references alongside drill descriptions — frontend looks up and links to the coach's drill library entry
- **11.1.5** Natural language session query: `POST /sessions/search` with `{ query: "sessions where wind was > 10mph and I scored below 9.5" }` — uses the AI to parse the query into structured filters and return matching sessions

### 11.2 — Predictive Analytics

- **11.2.1** Score trajectory forecast: `GET /analytics/forecast?shooterId=X&discipline=Y&weeks=8` — fits a linear regression to the last 30 sessions' averages; projects forward with 80% confidence interval. Returns `{projectedScore, confidenceLow, confidenceHigh, projectedDate}` for reaching a target score
- **11.2.2** Plateau detection service: identifies when a shooter's last 8 sessions are within ±0.3 pts of each other (no improvement trend). Flags via `smart_alert` in performance assistant and via push notification — suggests specific intervention drills
- **11.2.3** Overtraining risk flag: if sessions per week increases >40% over the 2-week baseline AND the last 3 sessions show declining scores, flag `overtraining_risk` alert — recommend 2-day rest
- **11.2.4** Optimal training frequency: `GET /analytics/optimal-frequency?shooterId=X` — analyzes historical rest gaps between sessions and corresponding score changes to find the rest period that correlates with best performance improvement

### 11.3 — Model Upgrades

- **11.3.1** Upgrade AI provider strategy: currently hardcoded to Groq / Llama 3.3 70B. Create `AiProviderService` abstraction with a `provider` config enum (GROQ / GOOGLE_GEMINI / OPENAI) — switch provider via environment variable without code changes
- **11.3.2** Add Gemini 2.0 Flash as a fallback: if Groq is rate-limited (14,400 req/day shared), fall back to `gemini-2.0-flash` for the AI coach call — configure via `AI_PROVIDER_FALLBACK` env var
- **11.3.3** Prompt versioning: store the system prompt hash alongside every `AiCoachAnalysis.model` field — enables reproducibility and comparison between prompt versions
- **11.3.4** AI analysis caching: if the same session (same shots, same context) is analyzed within 24 hours, return the cached result rather than calling the AI again — saves API quota and latency. Cache key: `sha256(sessionId + lastShotTimestamp)`

### 11.4 — Range-Level Analytics (New)

- **11.4.1** Lane utilization heatmap: `GET /ranges/:id/analytics/utilization` — returns a 7×24 matrix (weekday × hour) with average occupied lanes count — displayed as a color-gradient heatmap in the range dashboard
- **11.4.2** Discipline popularity trend: line chart over the last 12 months showing session count per discipline at this range — helps range plan which bays to configure for which disciplines
- **11.4.3** Member engagement score: per-member metric — combines sessions this month, booking vs. walk-in ratio, social features used (coach connected, competitions entered) — surfaced in the member retention table to identify at-risk members

---

## CATEGORY 12: MOBILE APP ENHANCEMENTS

### 12.1 — iOS Support (Parity with Android)

- **12.1.1** Apple HealthKit integration: Capacitor plugin `@capacitor-community/health` — mirror the Android Health Connect functionality for iOS. Pull HR, SpO2, steps, calories, active minutes for the session window
- **12.1.2** iOS push notifications: configure Capacitor Push Notifications plugin for APNs (Apple Push Notification Service) — requires Apple Developer provisioning profile
- **12.1.3** iOS widget: use Capacitor `@capacitor-community/app-widget` to create a home-screen widget showing: today's training plan, current PB score, next booking time

### 12.2 — Offline-First Architecture

- **12.2.1** Local SQLite database: use `@capacitor-community/sqlite` — create local schema mirroring the critical models (Session, Shot, TrainingEvent). All writes go to local DB first
- **12.2.2** Sync queue: `SyncQueue` table in local SQLite — records pending creates/updates/deletes with their API payloads. Background sync worker fires when network is available
- **12.2.3** Conflict resolution: if a session was modified on two devices, use last-write-wins with a `conflictToast` ("Changes from your other device were applied — tap to review")
- **12.2.4** Offline shot entry: even with no internet, a shooter can start a session, log all shots, and end the session — data syncs on reconnect without data loss

### 12.3 — Mobile UX Enhancements

- **12.3.1** Biometric app lock: `@capacitor-community/biometric-auth` — optional Face ID / fingerprint lock on app open; respects iOS/Android system settings
- **12.3.2** Camera quick-launch: a persistent floating action button (FAB) on mobile session pages launches the camera for shot scoring (vision service) without navigating through menus
- **12.3.3** Haptic feedback: `Haptics.impact()` on: shot logged, achievement unlocked, AI analysis complete, booking confirmed — native feel that web doesn't provide
- **12.3.4** Landscape mode layout: the target canvas and session entry form adapt to landscape orientation — important for tablet use at the shooting bench
- **12.3.5** Voice shot entry: long-press the shot entry field to activate voice recognition ("ten point eight" → `10.8`). Uses `SpeechRecognition` API — available in Capacitor WebView
- **12.3.6** Bottom sheet patterns: replace full-screen modals on mobile with native-feeling bottom sheets (using `@gorhom/bottom-sheet` or a CSS-only equivalent) for shot entry, feedback, filters

---

## CATEGORY 13: UI / UX IMPROVEMENTS

### 13.1 — Range Operations UI

- **13.1.1** Interactive range map: SVG-based bird's-eye view of the range with numbered, color-coded lanes. Click a lane to see occupant, remaining session time, and quick-action buttons (Extend session, Close lane, Mark maintenance)
- **13.1.2** Booking management calendar: FullCalendar-style weekly/monthly view showing all bookings as color-coded blocks per lane — drag to move, click to view/cancel
- **13.1.3** Member check-in kiosk mode: `/staff/checkin` — large-format UI designed for a tablet at the reception desk. QR scanner (camera) or name search. Shows member photo, membership status, and today's booking in one glance

### 13.2 — Session Entry UX

- **13.2.1** Speed-optimized shot entry: dedicated "rapid fire" mode — full-screen number pad + decimal button. "Auto-advance" option: after entering each shot score, cursor auto-moves to next shot number. Target UX: 1 shot logged per 2 seconds
- **13.2.2** Shot entry via hardware barcode scanner: Bluetooth barcode scanners (common at electronic scoring ranges) emit keystrokes — the shot entry field accepts barcode scanner input (score as barcode, scanned directly into the field)
- **13.2.3** Series visual separators: in the shot list, render a visual divider after every 10 shots with the series average shown — makes it easy to review series-by-series during the session

### 13.3 — Data Visualization Enhancements

- **13.3.1** Animated session replay: play button on the TargetCanvas that animates each shot appearing one-by-one in chronological order, with a shot counter and running score display — great for reviewing a session with a coach
- **13.3.2** Radar chart for technique dimensions: spider chart with 6 axes (posture, breathing, trigger, stability, follow-through, mental) — plotted from the AI technique insights. Overlay last 3 sessions to see dimension-level progress
- **13.3.3** Environmental overlay on target: when weather data is available for a session, show a wind arrow overlay on the target canvas indicating wind direction and speed at the time of the session
- **13.3.4** Split-half chart: bar chart comparing first-half vs. second-half of session average scores — visually shows fatigue effect. Shown on the session deep analysis page

### 13.4 — Onboarding & Empty States

- **13.4.1** Multi-step onboarding wizard: new user → step 1: role selection (shooter/coach/range admin) → step 2: profile setup → step 3: first weapon (shooter) or first squad (coach) → step 4: connect to a coach (shooter) or invite shooters (coach) → step 5: first session tutorial
- **13.4.2** Interactive tutorial: tooltip-based guided tour using a simple spotlight library — highlights key UI elements on first visit to each major section
- **13.4.3** Sample data mode: `POST /dev/seed-demo-data` (accessible only in development + staging environments) populates an account with 10 demo sessions and realistic shot data so the UI looks live during demos
- **13.4.4** Contextual empty states: every empty state has a specific illustration, relevant explanation, and a primary action button — no generic "No data" messages

### 13.5 — Theme & Accessibility

- **13.5.1** Dim theme variant: softer version of the dark theme (dark backgrounds become `#1A1F2E` instead of `#080A0F`) — for use in low-light range environments where the current theme is too high-contrast
- **13.5.2** Font size accessibility control: `Settings → Display → Text Size` slider — scales all `font-size` values by a multiplier (1.0x / 1.15x / 1.3x). Important for older shooters
- **13.5.3** WCAG 2.1 AA audit: run `axe-core` automated accessibility tests on all pages. Fix all critical violations: missing `aria-label`, insufficient color contrast, non-keyboard-navigable interactive elements
- **13.5.4** Keyboard shortcuts map: extend existing `CommandPalette` with full shortcut reference — `N` = new session, `S` = save, `F` = open feedback, `Esc` = close modal, `?` = open shortcut reference, `/` = focus search

---

## CATEGORY 14: HARDWARE INTEGRATION LAYER

### 14.1 — Electronic Scoring System

- **14.1.1** Sius/Megalink adapter service: NestJS `ElectronicTargetService` that listens on a configurable TCP socket for incoming shot data from a Sius scoring unit over the range LAN. Maps incoming X/Y/score packets to the Marksman shot format and fires `POST /shots` internally
- **14.1.2** Batch shot import endpoint: `POST /sessions/:id/shots/import` — accepts an array of shots in various formats (ISSF standard JSON, Sius XML, Megalink CSV) and bulk-inserts them. Used when importing from external scoring systems after the fact
- **14.1.3** SCATT trainer integration: parse SCATT MX-W2 `.scatt` file export — extract trace path data (pre-shot movement) and insert as a `ShotTrace` model linked to each shot. Trace visualization on the target canvas shows pre-shot movement path
- **14.1.4** Chronograph integration: `POST /equipment/:id/velocity-readings` — accepts a CSV or JSON upload from LabRadar or MagnetoSpeed chronograph. Stores velocity readings per shot; used to improve ballistic calculations

### 14.2 — Range Infrastructure APIs

- **14.2.1** Lane display API: `GET /ranges/:id/lanes/:laneId/display` (no auth — polling endpoint) — returns current session info for a lane (shooter name, shot count, current avg, elapsed time, remaining time) — a Raspberry Pi on each lane polls this every 5 seconds and drives a lane-side display
- **14.2.2** Access gate webhook: `POST /ranges/:id/gate/validate` — range gate hardware calls this endpoint with a QR code payload; server returns `{ allow: true, memberName: string, tier: string }` or `{ allow: false, reason: string }`
- **14.2.3** PA system display integration: `POST /ranges/:id/pa-message` (RANGE_ADMIN / RSO only) — posts a text message that appears as a ticker/banner on all lane displays and as a push notification to all active session apps at that range
- **14.2.4** Score display screen: `GET /competitions/:id/scoreboard` (existing but enhance) — add `format=kiosk` query param that returns a server-side rendered HTML page optimized for full-screen TV display, with auto-refresh meta tag (no JavaScript required for display)

### 14.3 — Wearable Integrations

- **14.3.1** Garmin Connect IQ integration: document the existing custom sensor API so a Garmin IQ developer can build a companion app that pushes HR/HRV from a Garmin watch directly to the `POST /biometrics/readings` endpoint using the custom sensor API key
- **14.3.2** Polar H10 direct BLE: use Web Bluetooth API (`navigator.bluetooth`) in the web app to directly connect to a Polar H10 HR strap — no phone app needed. Stream heart rate samples every second during session. Works in Chrome/Edge on Android
- **14.3.3** Respiration rate estimation from camera: add an experimental feature flag (`ENABLE_CAMERA_RR=true`) — uses the front-facing camera and a PPG (photoplethysmography) ML model via TensorFlow.js to estimate respiratory rate without a sensor. Results marked as `confidence: low` in biometric readings

---

## CATEGORY 15: BACKEND INFRASTRUCTURE & DEVOPS

### 15.1 — Caching Layer

- **15.1.1** Redis integration: add `@nestjs/cache-manager` with `cache-manager-redis-yet` store. Configure `REDIS_URL` env var
- **15.1.2** Cache strategy: coach dashboard → 60s, range availability matrix → 30s, leaderboard → 120s, weather data → 900s, AI analysis → 24hr (content-addressed cache key)
- **15.1.3** Cache invalidation: use Redis `DEL` patterns to invalidate caches on mutations — e.g., on `POST /shots`, invalidate `analytics:{sessionId}` and `dashboard:{coachId}`

### 15.2 — File Storage (S3-Compatible)

- **15.2.1** Replace any local disk storage with Cloudflare R2 (S3-compatible API, free egress): install `@aws-sdk/client-s3` configured with R2 endpoint and `CLOUDFLARE_R2_*` env vars
- **15.2.2** `StorageService`: wraps S3 client — methods: `uploadFile(buffer, key, mimeType)`, `getSignedUrl(key, expiresIn)`, `deleteFile(key)`. Used by profile photos, incident photos, PDFs, voice memos, document uploads
- **15.2.3** Signed URLs: never return raw S3 URLs — always generate pre-signed URLs with 1-hour expiry. Protects sensitive documents (medical notes, ID scans) from direct access

### 15.3 — Real-Time WebSocket Hardening

- **15.3.1** Room-scoped events: review all `gateway.server.emit(...)` calls — scope to rooms. Session events → `session:{id}` room; coach events → `coach:{id}` room; range events → `range:{id}` room. Prevents data leaks across users
- **15.3.2** WebSocket auth middleware: validate JWT on connection and on every `emit` — reject events from expired tokens. Send `auth:expired` event to client → client auto-shows "Session expired" dialog
- **15.3.3** Connection heartbeat: server sends `ping` every 25s; client responds with `pong`. If no pong in 30s, server closes the connection and cleans up the room subscription
- **15.3.4** Reconnect state recovery: on client reconnect, server sends a `catch_up` payload containing events the client missed while disconnected (stored in a 5-minute in-memory buffer per session)

### 15.4 — Observability & Monitoring

- **15.4.1** Structured logging: replace all `console.log` with the NestJS `Logger` service. JSON-structured logs with `requestId`, `userId`, `action`, `duration`, `statusCode` fields — compatible with log aggregation tools
- **15.4.2** Request ID tracing: generate `X-Request-ID` UUID on every incoming request; pass through to all downstream calls; include in all log entries; return in response headers
- **15.4.3** Prometheus metrics: expose `/metrics` endpoint via `@willsoto/nestjs-prometheus` — track: HTTP request count/latency by route, active WebSocket connections, queue depth, AI API call latency, cache hit/miss ratio
- **15.4.4** Health check endpoint: `/health` returns `{ status, database, redis, groq }` — used by Railway/Kubernetes liveness probes
- **15.4.5** Error tracking: integrate Sentry via `@sentry/nestjs` — capture unhandled exceptions with full stack trace, user context, and request details. Frontend: `@sentry/nextjs`

### 15.5 — CI/CD Pipeline

- **15.5.1** GitHub Actions workflow: on every PR → `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build` — block merge on any failure
- **15.5.2** Database migration safety: in the CI pipeline, run `prisma migrate deploy --preview-feature` against a test database to verify migrations apply cleanly before merging to main
- **15.5.3** Staging environment: maintain a separate Railway/Vercel staging deployment. PRs automatically deploy to a preview URL (Vercel preview deployments already work — add API staging deployment)
- **15.5.4** Automated E2E tests: Playwright tests for the 5 critical user flows — register + login, start session + log shots, coach view shooter session, book a lane, complete a competition entry

---

## CATEGORY 16: REPORTING & EXPORT ENHANCEMENTS

### 16.1 — Report Builder

- **16.1.1** Custom report builder UI: drag-and-drop section selector — choose from: score trend chart, ring distribution, shot heatmap, series comparison, AI insights, coach feedback history, biometric summary, competition results, equipment used — generate a customized PDF
- **16.1.2** Scheduled reports: coach configures a recurring PDF report (weekly / monthly) for a specific shooter — auto-generated on schedule and emailed
- **16.1.3** Shareable report link: `GET /reports/:reportId/share` — generates a JWT-signed URL that expires in 7 days — renders a read-only, no-login-required web view of the report. Used to share with a parent or national federation selector

### 16.2 — Export Formats

- **16.2.1** ISSF official scoresheet PDF: `GET /sessions/:id/export/issf-scoresheet` — auto-fills the official ISSF 60-shot scoresheet template (standard A4 layout) from the session's shot data
- **16.2.2** Excel export with charts: `GET /sessions/:id/export/excel` — uses `ExcelJS` to generate an XLSX file with multiple sheets: session summary, shot-by-shot data, series chart, ring distribution chart (embedded as an image)
- **16.2.3** Full data export (JSON): `GET /shooters/:id/export/json?from=...&to=...` — complete raw data export for data portability or import into third-party analysis tools (R, Python, Excel)
- **16.2.4** Google Sheets sync (optional): `POST /integrations/google-sheets/sync` — uses Google Sheets API to push session summary data to a shooter's personal Google Sheet on demand

---

## CATEGORY 17: LOCALIZATION & MULTI-REGION

### 17.1 — Internationalization

- **17.1.1** Install `next-intl` for Next.js — configure locale routing (`/en`, `/hi`, `/ta`) with automatic locale detection from browser `Accept-Language` header
- **17.1.2** Translation files: JSON translation files for English (complete), Hindi (`hi`), Tamil (`ta`), Marathi (`mr`) — all UI strings, error messages, email templates, and AI system prompts localized
- **17.1.3** Units system: `unitsPreference` on User model — METRIC (meters, Celsius, kilograms) vs. IMPERIAL (yards, Fahrenheit, pounds). All distance/temperature displays adapt. Session entry form uses the user's preferred unit. Stored in DB as metric, converted on display
- **17.1.4** Currency locale: `currencyPreference` on User model (INR / USD / GBP / EUR / AED). All price displays adapt formatting. Stripe/Razorpay configured for the correct currency at checkout
- **17.1.5** Date/time locale: all dates formatted using the user's browser locale via `Intl.DateTimeFormat`. All datetimes stored as UTC in the database and converted to user's timezone (stored in `User.timezone` from browser detection on first login)

### 17.2 — Multi-Region Infrastructure

- **17.2.1** Vercel Edge Functions: migrate static API routes (weather, leaderboard) to Vercel Edge for global CDN response times <50ms
- **17.2.2** Regional database: support EU-West and APAC PostgreSQL instances — users select their data region on registration; GDPR compliance for EU users
- **17.2.3** Offline map tiles: self-host OpenStreetMap tiles via `martin` tile server for the range location map view — eliminates Google Maps API billing; works offline at the range

---

## CATEGORY 18: LONG-TERM VISION FEATURES

*12–36 month horizon — strategic capabilities for market leadership*

### 18.1 — National Federation Integration

- **18.1.1** Federation API: a read-only REST + GraphQL API that federations can authenticate against (using federation-scoped API keys) to pull anonymized aggregate performance data, competition results, and shooter rankings for talent identification programs
- **18.1.2** Selection trial management: specialized competition type for national selection trials — includes blind scoring (judges don't see shooter names until scoring is complete), official score attestation workflow (RSO + federation official dual-sign-off), automatic DQ detection (shot fired after time)
- **18.1.3** Quota tracking: for Olympic/Commonwealth Games — track national quota places won per discipline based on accumulated ranking points from competitions logged on the platform

### 18.2 — Video Analysis Integration

- **18.2.1** Shot video capture: on mobile, record a 30-second video clip tied to a specific shot (coach uses this to capture a shooter's technique for a specific shot). Video uploaded to S3, linked to the `Shot` record as `videoUrl`
- **18.2.2** AI video analysis: pass the video URL to Gemini 2.0 (vision-capable) with a prompt analyzing the shooter's stance, grip, hold area, and trigger pull visible in the video — returns structured critique in the same format as `AiCoachFinding`
- **18.2.3** Before/after technique comparison: place two videos (one from session 1, one from session 50) side-by-side in a synchronized player — visually demonstrate technique improvement

### 18.3 — Advanced Biometrics

- **18.3.1** Shot-synchronized biometrics: currently biometric readings and shots are stored independently. Link them by timestamp — `Shot.heartRateAtMoment` and `Shot.respirationPhaseAtMoment` (inhale/exhale/hold). Enables correlation: does HR > 75 at shot moment correlate with lower scores?
- **18.3.2** Optimal shot window detection: ML model trained on the shooter's personal biometric data + scores — predicts the optimal 2-second window within each breathing cycle to fire, based on their specific HR and breathing pattern. Shows as a "green window" indicator on a real-time biometric display during the session
- **18.3.3** HRV recovery monitoring: track Heart Rate Variability before and after training sessions. HRV is a sensitive indicator of CNS fatigue — declining HRV trend over 5 days suggests accumulated fatigue → recommend rest

### 18.4 — Marketplace & Ecosystem

- **18.4.1** Coach marketplace: public directory where verified coaches list their services, rates, and availability. Shooters browse, review, and book coaching sessions (with payment) directly through the platform. Platform takes a commission
- **18.4.2** Equipment marketplace: private listing service — verified members can list used equipment for sale to other members of the same range. Range gets a commission on successful transactions
- **18.4.3** Drill & training plan store: coaches can sell their curated drill libraries and training plan templates to other coaches or shooters on a marketplace model
- **18.4.4** Range listing network: ranges list themselves on a national "Find a Range" directory. Shooters visiting a new city can find ranges, see their membership tiers, book a day pass, and start a session — all without leaving the app

### 18.5 — Gamification Layer

- **18.5.1** Challenges system: weekly and monthly challenges created by coaches or ranges — "Hit 20 X-rings this week", "Maintain avg > 9.5 for 5 consecutive sessions", "Complete a 60-shot session in under 90 minutes". Rewards: achievement badges, membership discount credits, public recognition on the range leaderboard
- **18.5.2** Team competitions: squads from different ranges compete against each other in a "virtual match" — each team member shoots on their own range on the same day; scores aggregated and compared. No travel required
- **18.5.3** Season leaderboard: 12-month rolling leaderboard with distinct season end dates — end of season stats preserved and shown as "Season X Champion" on athlete profile

---

## Priority Matrix

| Priority | Category | Effort (Person-Weeks) | Business Impact |
|----------|----------|----------------------|-----------------|
| 🔴 **P0 — Do Now** | 1: API Hardening (DTOs, Security) | 1–2 | Critical — prevents data corruption |
| 🔴 **P0 — Do Now** | 9: Notification System | 2–3 | High — core engagement feature |
| 🔴 **P0 — Do Now** | 2.1–2.2: Lane + Booking | 3–4 | Very High — first paid feature |
| 🟠 **P1 — Next Sprint** | 10: New Roles (RANGE_ADMIN, RSO) | 1–2 | High — unblocks range operations |
| 🟠 **P1 — Next Sprint** | 3.1–3.3: Player Profile + PB + Achievements | 2–3 | High — shooter retention |
| 🟠 **P1 — Next Sprint** | 8: Billing (Stripe/Razorpay) | 3–4 | Critical — enables revenue |
| 🟠 **P1 — Next Sprint** | 4.2–4.4: Squad + Drill Library | 2–3 | High — coach retention |
| 🟡 **P2 — Backlog** | 5: Competition Management | 4–6 | High — differentiator |
| 🟡 **P2 — Backlog** | 7: Safety & Compliance | 3–4 | High — legal requirement for ranges |
| 🟡 **P2 — Backlog** | 6.1–6.2: Equipment + Ammo Tracking | 2–3 | Medium — shooter value-add |
| 🟡 **P2 — Backlog** | 11: AI Enhancements | 3–5 | High — core differentiation |
| 🟡 **P2 — Backlog** | 2.3: Membership System | 2–3 | High — recurring revenue |
| 🟢 **P3 — Future** | 12: Mobile Offline + iOS | 4–6 | High — user experience |
| 🟢 **P3 — Future** | 14: Hardware Integration | 6–10 | Medium — niche but powerful |
| 🟢 **P3 — Future** | 17: Localization | 4–6 | Medium — market expansion |
| 🟢 **P3 — Future** | 18: Long-Term Vision | 20+ | High — market leadership |

---

## Total Feature Count

| Category | Items |
|----------|-------|
| API Hardening | 26 |
| Range Management | 32 |
| Player Enhancement | 28 |
| Coach Enhancement | 37 |
| Competition Management | 17 |
| Equipment & Armory | 22 |
| Safety & Compliance | 18 |
| Billing | 19 |
| Notifications | 16 |
| Roles & Multi-Tenancy | 15 |
| AI Analytics | 14 |
| Mobile | 13 |
| UI/UX | 16 |
| Hardware Integration | 12 |
| Backend Infrastructure | 22 |
| Reporting & Export | 9 |
| Localization | 7 |
| Long-Term Vision | 15 |
| **TOTAL** | **~338 distinct items** |
