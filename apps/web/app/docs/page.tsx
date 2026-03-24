// apps/web/app/docs/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '../../components/AppShell';
import { TabBar, useTabParam } from '../../components/ui/TabBar';

const GuidanceSection = dynamic(
  () => import('../../components/docs/GuidanceSection'),
  { ssr: false },
);

// ── Section registry ───────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'getting-started',  label: 'Getting Started',       icon: <IcoRocket /> },
  { id: 'dashboard',        label: 'Your Dashboard',         icon: <IcoGrid /> },
  { id: 'sessions',         label: 'Recording Sessions',     icon: <IcoTarget /> },
  { id: 'scores',           label: 'Scores & Analytics',     icon: <IcoChart /> },
  { id: 'ai-coach',         label: 'AI Coach',               icon: <IcoSparkle /> },
  { id: 'coach-connect',    label: 'Coach Connection',       icon: <IcoLink /> },
  { id: 'for-coaches',      label: 'For Coaches',            icon: <IcoPeople /> },
  { id: 'for-soldiers',     label: 'For Soldiers',           icon: <IcoStar /> },
  { id: 'technique',        label: 'Technique Guide',        icon: <IcoBook /> },
] as const;

// ── Callout components ─────────────────────────────────────────────────────────

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-[rgba(245,166,35,0.06)] border border-[rgba(245,166,35,0.2)] mt-4 mb-2">
      <span className="text-[#F5A623] mt-0.5 shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#F5A623" strokeWidth="1.5"/>
          <path d="M8 7v5M8 5v.5" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>
      <p className="text-text-secondary text-[13px] leading-relaxed">{children}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-[rgba(255,77,109,0.06)] border border-[rgba(255,77,109,0.2)] mt-4 mb-2">
      <span className="text-[#FF4D6D] mt-0.5 shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="#FF4D6D" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M8 6.5v3.5M8 11.5v.5" stroke="#FF4D6D" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>
      <p className="text-text-secondary text-[13px] leading-relaxed">{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-[rgba(79,195,247,0.05)] border border-[rgba(79,195,247,0.18)] mt-4 mb-2">
      <span className="text-[#4FC3F7] mt-0.5 shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="3" stroke="#4FC3F7" strokeWidth="1.5"/>
          <path d="M5 8h6M5 5h4M5 11h3" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>
      <p className="text-text-secondary text-[13px] leading-relaxed">{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mt-5">
      <div className="shrink-0 w-7 h-7 rounded-full bg-[rgba(245,166,35,0.12)] border border-[rgba(245,166,35,0.3)]
                      flex items-center justify-center mt-0.5">
        <span className="font-display font-bold text-[13px] text-[#F5A623]">{n}</span>
      </div>
      <div className="flex-1">
        <p className="font-display font-semibold text-sm text-text-primary mb-1">{title}</p>
        <div className="text-text-secondary text-[13px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-display font-bold text-xl text-text-primary mt-10 mb-4 pt-2
                 flex items-center gap-3 scroll-mt-6"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-[#1E2433] to-transparent" />
      {children}
      <span className="h-px flex-1 bg-gradient-to-l from-[#1E2433] to-transparent" />
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold text-base text-text-primary mt-7 mb-3 flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-[#F5A623]" />
      {children}
    </h3>
  );
}

function RoleBadge({ role }: { role: 'SHOOTER' | 'COACH' | 'ALL' }) {
  const cfg = {
    SHOOTER: { color: '#4FC3F7', bg: 'rgba(79,195,247,0.08)', label: 'Shooter' },
    COACH:   { color: '#F5A623', bg: 'rgba(245,166,35,0.08)',  label: 'Coach'   },
    ALL:     { color: 'var(--text-secondary)', bg: 'rgba(136,146,164,0.08)', label: 'All roles'},
  }[role];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}30` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// Score ring legend
function ScoreRing({ score, label, color }: { score: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: color, backgroundColor: `${color}10` }}
      >
        <span className="score-value text-xs font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-[10px] font-display uppercase tracking-wide text-text-muted">{label}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function DocsContent() {
  const [active, setActive] = useState('getting-started');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  function jumpTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
      <div className="flex gap-8 max-w-6xl">

        {/* ── Sticky TOC ──────────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-6">
            <p className="label mb-4">Contents</p>
            <nav className="space-y-0.5">
              {SECTIONS.map(({ id, label, icon }) => {
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => jumpTo(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
                                transition-all duration-150 text-xs font-display font-semibold uppercase tracking-wide
                                ${isActive
                                  ? 'bg-[rgba(245,166,35,0.08)] text-[#F5A623] border-l-2 border-[#F5A623]'
                                  : 'text-text-muted hover:text-text-secondary hover:bg-elevated'}`}
                  >
                    <span className="w-4 h-4 shrink-0 flex items-center justify-center">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <article className="flex-1 min-w-0 pb-24">

          {/* Hero */}
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)]
                              flex items-center justify-center">
                <IcoBook size={20} />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-text-primary">User Guide</h1>
                <p className="text-text-muted text-xs font-display uppercase tracking-widest">Marksman Platform</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
              Everything you need to track training sessions, analyse shot data, receive AI-powered coaching,
              and connect with coaches or shooters — all in one place.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 1. GETTING STARTED                                             */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="getting-started">Getting Started</SectionHeading>

          <p className="text-text-secondary text-[13px] leading-relaxed">
            Marksman supports three roles — <strong className="text-text-primary">Shooter</strong>,{' '}
            <strong className="text-text-primary">Coach</strong>, and{' '}
            <strong className="text-text-primary">Soldier</strong>.
            Choose the role that matches how you train.
          </p>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {[
              {
                role: 'SHOOTER' as const,
                title: 'Shooter',
                color: '#4FC3F7',
                desc: 'Competitive or recreational shooters. Log sessions, view analytics, connect with a coach, and get AI feedback.',
              },
              {
                role: 'COACH' as const,
                title: 'Coach',
                color: '#F5A623',
                desc: 'Certified coaches. View your shooters\' sessions in real time, post feedback, and track progress over time.',
              },
            ].map(({ role, title, color, desc }) => (
              <div
                key={role}
                className="rounded-xl p-4 border"
                style={{ borderColor: `${color}25`, backgroundColor: `${color}06` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-display font-bold text-sm" style={{ color }}>{title}</span>
                </div>
                <p className="text-text-muted text-[12px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <SubHeading>Creating Your Account</SubHeading>

          <Step n={1} title="Go to the Register page">
            Click <strong className="text-text-primary">Create account</strong> on the login screen, or navigate to <code className="text-[#4FC3F7] bg-elevated px-1.5 py-0.5 rounded text-xs">/auth/register</code>.
          </Step>
          <Step n={2} title="Select your role">
            Choose <strong className="text-text-primary">Shooter</strong>, <strong className="text-text-primary">Coach</strong>, or <strong className="text-text-primary">Soldier</strong>.
            If you select Soldier, you will also be asked to choose your primary weapon.
          </Step>
          <Step n={3} title="Fill in your details">
            Enter your full name, email address, and a password (minimum 8 characters, must include uppercase, lowercase, and a number).
          </Step>
          <Step n={4} title="Sign in">
            After registration you are taken straight to your dashboard. On future visits, use the login page with your email and password.
          </Step>

          <Tip>
            Your role cannot be changed after registration. If you need a different role, create a new account.
          </Tip>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 2. DASHBOARD                                                   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="dashboard">Your Dashboard</SectionHeading>

          <p className="text-text-secondary text-[13px] leading-relaxed">
            The dashboard is your home base. It shows a live summary of your training and gives you quick links to all features.
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                role: 'SHOOTER' as const,
                items: [
                  'Total sessions recorded',
                  'Total shots fired',
                  'Season average score',
                  'Personal best shot',
                  'Recent sessions list with quick View link',
                  'Quick-launch buttons: New Session and AI Coach',
                ],
              },
              {
                role: 'COACH' as const,
                items: [
                  'Number of approved shooters',
                  'Total feedback posts submitted',
                  'List of your shooters with their recent session stats',
                  'Quick access to each shooter\'s session history',
                ],
              },
            ].map(({ role, items }) => (
              <div key={role} className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2">
                  <RoleBadge role={role} />
                  <span className="text-text-secondary text-xs">Dashboard</span>
                </div>
                <ul className="p-4 space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-text-secondary">
                      <span className="text-[#F5A623] mt-1 shrink-0">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Note>
            The sidebar on the left shows only the pages relevant to your role. Coaches see Shooters; Soldiers see Weapons and Field Analytics; Shooters see Connect.
          </Note>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 3. RECORDING SESSIONS                                          */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="sessions">Recording Sessions</SectionHeading>

          <p className="text-text-secondary text-[13px] leading-relaxed">
            A <strong className="text-text-primary">session</strong> represents a single training block — one weapon, one discipline, one range distance.
            Within a session you record individual shots, each with a score and optional coordinates.
          </p>

          <SubHeading>Creating a New Session</SubHeading>

          <Step n={1} title="Open New Session">
            Click <strong className="text-text-primary">New Session</strong> in the sidebar or on your dashboard.
          </Step>
          <Step n={2} title="Choose a quick preset (optional)">
            Presets auto-fill the common fields. Shooters have Air Rifle and Pistol presets; Soldiers have AK-203, Glock 17, and Sig716 presets.
          </Step>
          <Step n={3} title="Set session details">
            <ul className="mt-2 space-y-1">
              {[
                ['Discipline', 'Your shooting discipline (e.g. Air Rifle 10m, Rifle .22 50m)'],
                ['Distance', 'Range distance in metres'],
                ['Weapon', 'Select from the list or choose Custom Gun and type your own'],
                ['Number of Shots', 'How many shots you plan to fire'],
                ['Date', 'The session date (defaults to today)'],
                ['Training Mode', 'Soldiers only — select Marksmanship, Rapid Fire, Field Exercise, Combat Simulation, or Qualification'],
              ].map(([field, desc]) => (
                <li key={field as string} className="flex gap-2">
                  <span className="text-[#F5A623] text-xs mt-0.5 shrink-0">›</span>
                  <span><strong className="text-text-primary text-xs">{field}</strong><span className="text-text-muted text-xs"> — {desc}</span></span>
                </li>
              ))}
            </ul>
          </Step>
          <Step n={4} title="Save the session">
            Click <strong className="text-text-primary">Create Session</strong>. You are taken to the session detail page.
          </Step>

          <SubHeading>Adding Shots</SubHeading>

          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            On the session detail page there are four ways to enter shots:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {[
              {
                title: 'Manual Entry',
                color: '#F5A623',
                desc: 'Type each shot\'s score and optional X/Y coordinates one at a time. Best for live range entry.',
              },
              {
                title: 'CSV / JSON Import',
                color: '#4FC3F7',
                desc: 'Upload a CSV or JSON file with shot data. Useful when your scoring system can export data.',
              },
              {
                title: 'PDF Import',
                color: '#00E5A0',
                desc: 'Upload a PDF score sheet. The system parses shot scores automatically.',
              },
              {
                title: 'Vision Analysis',
                color: '#FF4D6D',
                desc: 'Upload a photo of a physical target. Computer vision detects hits and plots their coordinates.',
              },
            ].map(({ title, color, desc }) => (
              <div key={title} className="rounded-xl p-4 border border-border-subtle bg-elevated">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-display font-semibold text-sm" style={{ color }}>{title}</span>
                </div>
                <p className="text-text-muted text-[12px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <SubHeading>The Target Canvas</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Once shots are recorded, the target canvas shows all hits plotted on a scaled target diagram.
            Each dot is colour-coded by score:
          </p>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            <ScoreRing score="≥10.5" label="Gold (X)" color="#F5A623" />
            <ScoreRing score="≥10.0" label="Blue (10)" color="#4FC3F7" />
            <ScoreRing score="≥9.0"  label="Green (9)" color="#00E5A0" />
            <ScoreRing score="<9.0"  label="Red (8–)" color="#FF4D6D" />
          </div>
          <div className="mt-4 space-y-1.5">
            {[
              'Hover over a dot to see its shot number, score, and coordinates.',
              'Use the scroll wheel or pinch to zoom in/out.',
              'Click Export PNG to save a target image for your training log.',
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 text-[13px] text-text-secondary">
                <span className="text-[#F5A623] shrink-0 mt-0.5">›</span>{t}
              </div>
            ))}
          </div>

          <Tip>
            Coordinates use a centimetre-based system: x=0, y=0 is the bull's-eye centre. Positive x is right, positive y is up.
          </Tip>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 4. SCORES & ANALYTICS                                          */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="scores">Scores & Analytics</SectionHeading>

          <SubHeading>The Scoring System</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Marksman uses decimal scoring as per ISSF rules. A perfect shot is <strong className="text-text-primary">10.9</strong> (the X-ring).
            Shots are scored to one decimal place.
          </p>

          <div className="mt-4 rounded-xl border border-border-subtle overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-elevated">
                  <th className="text-left py-2.5 px-4 label">Ring</th>
                  <th className="text-left py-2.5 px-4 label">Score</th>
                  <th className="text-left py-2.5 px-4 label">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['X-Ring',    '10.5 – 10.9', 'Inner bullseye — elite precision',                    '#F5A623'],
                  ['10-Ring',   '10.0 – 10.4', 'Bullseye — excellent shot',                           '#4FC3F7'],
                  ['9-Ring',    '9.0 – 9.9',   'Good shot, minor positioning deviation',               '#00E5A0'],
                  ['8-Ring',    '8.0 – 8.9',   'Acceptable, technique needs attention',                '#8892A4'],
                  ['Below 8',   '< 8.0',       'Significant deviation — review fundamentals',          '#FF4D6D'],
                ].map(([ring, score, meaning, color]) => (
                  <tr key={ring as string} className="border-b border-border-subtle/50">
                    <td className="py-2.5 px-4">
                      <span className="score-value text-xs font-bold" style={{ color: color as string }}>{ring}</span>
                    </td>
                    <td className="py-2.5 px-4 score-value text-text-secondary">{score}</td>
                    <td className="py-2.5 px-4 text-text-muted">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHeading>Understanding Your Analytics</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            After recording shots, the platform automatically calculates these metrics:
          </p>

          <div className="mt-4 space-y-3">
            {[
              {
                term: 'Average Score',
                color: '#F5A623',
                plain: 'The mean of all your shot scores in the session.',
                detail: 'Higher is better. A competitive air rifle score is 8.5+; elite shooters average 9.5–10.5.',
              },
              {
                term: 'MPI (Mean Point of Impact)',
                color: '#4FC3F7',
                plain: 'The centre point of all your shots combined — where your barrel naturally points.',
                detail: 'Shown as (x, y) coordinates. If x is negative your shots drift left; positive means right. If y is negative they drift low; positive means high. Aim for MPI within 0.3 of centre.',
              },
              {
                term: 'Group Radius',
                color: '#00E5A0',
                plain: 'The maximum distance between any two shots in the session.',
                detail: 'A smaller group radius means your shots land closer together — more consistent technique. Below 2.0 = elite. 2.0–4.0 = competitive. Above 6.0 = technique needs attention.',
              },
              {
                term: 'Standard Deviation',
                color: 'var(--text-secondary)',
                plain: 'How much your scores vary around the average.',
                detail: 'Below 0.5 = very consistent. 0.5–1.0 = acceptable variation. Above 1.0 = inconsistent technique, possibly varying trigger pressure or breathing timing.',
              },
              {
                term: 'Series Averages',
                color: '#FF4D6D',
                plain: 'Your average score for every 10-shot block within the session.',
                detail: 'Reveals fatigue and mental drift. If your later series drop below your first, you are likely losing focus or tiring. If you start low and improve, you need a better warm-up routine.',
              },
            ].map(({ term, color, plain, detail }) => (
              <div key={term} className="rounded-xl border border-border-subtle bg-surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-display font-semibold text-sm" style={{ color }}>{term}</span>
                </div>
                <p className="text-text-primary text-[13px] mb-1">{plain}</p>
                <p className="text-text-muted text-[12px] leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 5. AI COACH                                                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="ai-coach">AI Coach</SectionHeading>

          <p className="text-text-secondary text-[13px] leading-relaxed">
            The AI Coach analyses your session data using an advanced language model trained on shooting biomechanics
            and sport science. It produces a structured coaching report with specific, actionable findings.
          </p>

          <SubHeading>Running an Analysis</SubHeading>

          <Step n={1} title="Make sure your session has shots">
            The AI Coach requires at least one shot recorded. The more shots you have, the richer the analysis.
          </Step>
          <Step n={2} title="Open the AI Coach page">
            Click <strong className="text-text-primary">AI Coach</strong> in the sidebar.
          </Step>
          <Step n={3} title="Select your session">
            Choose the session you want to analyse from the drop-down list.
          </Step>
          <Step n={4} title="Click Analyse">
            The AI reads your shot data, scores, MPI, group radius, and series averages, then generates a full report. This takes 10–30 seconds.
          </Step>

          <SubHeading>Reading the Report</SubHeading>
          <div className="mt-3 space-y-3">
            {[
              {
                field: 'Overall Assessment',
                desc: 'A 2–3 sentence summary of the session quality and the main coaching theme.',
              },
              {
                field: 'Performance Rating',
                desc: 'A score out of 10 reflecting overall session quality based on scores, consistency, and shot placement.',
              },
              {
                field: 'Findings',
                desc: 'Individual observations, each tagged with a category (Positioning, Trigger, Breathing, Consistency, Endurance, Sight, or General) and a severity (Critical, Moderate, or Positive). Each finding includes an observation, a suggestion, and an optional drill.',
              },
              {
                field: 'Prioritised Actions',
                desc: 'The top 3 things to work on before your next session.',
              },
              {
                field: 'Next Session Focus',
                desc: 'One clear goal to carry forward.',
              },
            ].map(({ field, desc }) => (
              <div key={field} className="flex gap-3">
                <span className="text-[#F5A623] shrink-0 mt-0.5">›</span>
                <p className="text-[13px] text-text-secondary">
                  <strong className="text-text-primary">{field}</strong> — {desc}
                </p>
              </div>
            ))}
          </div>

          <Tip>
            Coaches can also run an AI analysis on any of their approved shooter's sessions. The report is generated from the coach's perspective.
          </Tip>

          <Warning>
            AI analysis is a coaching aid, not a substitute for a qualified coach. Always verify suggestions against your own body awareness and consult a professional coach for serious technique issues.
          </Warning>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 6. COACH CONNECTION                                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="coach-connect">Coach Connection <span className="ml-2"><RoleBadge role="SHOOTER" /></span></SectionHeading>

          <p className="text-text-secondary text-[13px] leading-relaxed">
            Shooters can connect with a registered coach. Once connected and approved, the coach can view your sessions, post feedback, and run AI analysis on your data.
          </p>

          <SubHeading>Requesting a Connection</SubHeading>
          <Step n={1} title="Go to Connect">
            Click <strong className="text-text-primary">Connect</strong> in the sidebar.
          </Step>
          <Step n={2} title="Browse available coaches">
            All registered coaches are listed. Click <strong className="text-text-primary">Request</strong> next to the coach you want to work with.
          </Step>
          <Step n={3} title="Wait for approval">
            Your request shows as <strong className="text-text-primary">Pending</strong>. The coach will receive a notification and approve or decline.
          </Step>
          <Step n={4} title="You are connected">
            Once approved, the coach can see your sessions. You will see the connection status update to <span className="text-[#00E5A0] font-semibold">Approved</span>.
          </Step>

          <SubHeading>Accepting a Coach Invitation</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Coaches can also invite you directly. When this happens, you will see a notification on the Connect page under <strong className="text-text-primary">Pending Invitations</strong>. Click <strong className="text-text-primary">Accept</strong> to approve the connection or <strong className="text-text-primary">Decline</strong> to refuse it.
          </p>

          <Note>
            A connection is always mutual — both sides must agree. Your shot data is only shared once the connection is approved.
          </Note>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 7. FOR COACHES                                                 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="for-coaches">For Coaches <span className="ml-2"><RoleBadge role="COACH" /></span></SectionHeading>

          <SubHeading>Managing Shooter Connections</SubHeading>
          <div className="mt-3 space-y-2">
            {[
              'Go to the Shooters page in the sidebar.',
              'Search for a shooter by email and send an invitation, or approve/decline incoming requests from shooters.',
              'Your active shooter list shows all approved connections.',
            ].map((t, i) => (
              <div key={i} className="flex gap-2 text-[13px] text-text-secondary">
                <span className="text-[#F5A623] shrink-0 mt-0.5 font-bold text-xs">{i + 1}.</span>{t}
              </div>
            ))}
          </div>

          <SubHeading>Viewing Shooter Sessions</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            On the Shooters page, click any approved shooter to see their session list with full analytics — scores, MPI, group radius, and the shot canvas.
          </p>

          <SubHeading>Posting Feedback</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Inside any shooter's session view, there is a <strong className="text-text-primary">Post Feedback</strong> panel at the bottom. Type your coaching notes and click <strong className="text-text-primary">Submit</strong>. The shooter sees your feedback in real time on their session page.
          </p>

          <Tip>
            Feedback is permanent once submitted — write carefully. Reference specific shot numbers or analytics values to make feedback actionable.
          </Tip>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 9. TECHNIQUE GUIDE                                             */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionHeading id="technique">Shooting Technique Guide</SectionHeading>

          <p className="text-text-secondary text-[13px] leading-relaxed">
            This guide summarises core fundamentals for standing position rifle and pistol shooting.
            Use it alongside your analytics — your MPI and group radius data will tell you which area needs the most attention.
          </p>

          {/* Positioning */}
          <SubHeading>1. Positioning</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Standing position is the most challenging — high centre of gravity, small support area.
            The goal is to transfer the rifle's weight through bones, not muscles.
          </p>
          <div className="mt-3 space-y-2">
            {[
              { tip: 'Foot width', detail: 'Shoulder-width apart, roughly 90° to the target. Left leg bears most weight and stays straight.' },
              { tip: 'Upper body', detail: 'Lean back slightly so the rifle\'s weight sits over the support area. Hips stay aligned with the target.' },
              { tip: 'Left arm (support)', detail: 'Elbow rests on the iliac crest (hip bone). Forearm nearly vertical. Muscles are relaxed — do not push the barrel.' },
              { tip: 'Right arm (firing)', detail: 'Relaxed grip on pistol grip. Right wrist as straight as possible. Trigger finger contacts trigger independently.' },
              { tip: 'Head', detail: 'Upright. Cheekbone rests on the cheek-piece with zero neck tension. The dominant eye looks straight through the sights.' },
              { tip: 'Zero-point check', detail: 'Close your eyes for 30 seconds. Open them — wherever the barrel points is your natural zero. Adjust your feet until this is the centre of the target.' },
            ].map(({ tip, detail }) => (
              <div key={tip} className="rounded-lg border border-border-subtle bg-elevated p-3">
                <span className="font-display font-semibold text-xs text-[#F5A623]">{tip}</span>
                <p className="text-text-muted text-[12px] mt-1 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <Note>
            If your MPI is left or right of centre, adjust your feet position first before touching the sight. If MPI is high or low, adjust the butt-plate.
          </Note>

          {/* Aiming */}
          <SubHeading>2. Aiming</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Aiming includes three components: sight symmetry, aiming time, and target approach.
          </p>
          <div className="mt-3 space-y-2">
            {[
              { tip: 'Sight symmetry', detail: 'The front sight insert must sit centred in the rear aperture. Even a small offset causes consistent group deviation.' },
              { tip: 'Aiming time', detail: 'Limit aiming time to under 8 seconds. After one blink cycle, your sight picture degrades. If you go over time — blink, breathe, and start the aiming process again.' },
              { tip: 'Target approach', detail: 'In standing position, approach the target from 12 o\'clock (top), letting the barrel drift naturally down to the bull. Do not chase the 11.' },
              { tip: 'Trust your reflexes', detail: 'A satisfactory sight picture is enough — do not wait for perfection. Your automatic centring reflex will often produce a better shot than conscious muscle correction.' },
            ].map(({ tip, detail }) => (
              <div key={tip} className="rounded-lg border border-border-subtle bg-elevated p-3">
                <span className="font-display font-semibold text-xs text-[#4FC3F7]">{tip}</span>
                <p className="text-text-muted text-[12px] mt-1 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          {/* Trigger */}
          <SubHeading>3. Trigger Control</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            The trigger is the last action before the shot breaks. Any disturbance here will move the barrel.
          </p>
          <div className="mt-3 space-y-2">
            {[
              { tip: 'Finger independence', detail: 'The trigger finger moves alone — no part of the hand, body, or rifle should react. Isolate the movement entirely.' },
              { tip: 'Direction of pull', detail: 'Squeeze backward, almost parallel to the barrel axis. Pulling at an angle introduces lateral movement.' },
              { tip: 'Follow-through', detail: 'Maintain position and sight picture for at least 1 second after the shot breaks. This ensures the pellet has left the barrel in the same conditions as the trigger release.' },
              { tip: 'Dry-fire drills', detail: 'Practice trigger release with no ammunition. Eyes open — concentrate on the sight picture staying still. Then repeat with eyes closed to focus on internal muscle sensation.' },
            ].map(({ tip, detail }) => (
              <div key={tip} className="rounded-lg border border-border-subtle bg-elevated p-3">
                <span className="font-display font-semibold text-xs text-[#00E5A0]">{tip}</span>
                <p className="text-text-muted text-[12px] mt-1 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <Note>
            If your MPI is consistently left or right and your sight is centred, trigger pull direction is the most likely cause. Practice dry-fire while watching the sight picture in a mirror.
          </Note>

          {/* Breathing */}
          <SubHeading>4. Breathing</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Breathing moves the barrel — typically up on inhale, down on exhale in standing position.
            The shot window is the pause between exhale and the next inhale.
          </p>
          <div className="mt-3 space-y-2">
            {[
              { tip: 'Pre-shot breathing', detail: '2–3 deep slow stomach breaths before bringing the rifle up. This slows your heart rate and reduces shoulder movement.' },
              { tip: 'Exhale to centre', detail: 'During your last exhale, the barrel drifts down to the target centre. This is when you take the first trigger stage.' },
              { tip: 'The pause', detail: 'Stop breathing once the barrel reaches centre. Release the trigger during this still window. The total pause — from exhale stop to follow-through — must not exceed 10 seconds.' },
              { tip: 'If over 10 seconds', detail: 'Lower the rifle. Breathe normally for 5–10 seconds. Start the shot routine again. Holding breath beyond 10 seconds drops oxygen, impairs vision, and increases muscle tension.' },
            ].map(({ tip, detail }) => (
              <div key={tip} className="rounded-lg border border-border-subtle bg-elevated p-3">
                <span className="font-display font-semibold text-xs text-[#FF4D6D]">{tip}</span>
                <p className="text-text-muted text-[12px] mt-1 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <Note>
            If your series averages drop in later 10-shot blocks, breathing discipline is often the cause — fatigue leads to holding breath slightly too long or inhaling before the shot breaks.
          </Note>

          {/* Shot Routine */}
          <SubHeading>5. Shot Routine</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            A routine is a fixed sequence of actions performed identically for every single shot.
            Under competition pressure, your routine is what keeps quality consistent.
          </p>
          <div className="mt-4 relative pl-6 space-y-0">
            {[
              'Take a stable position and pick up the rifle',
              'Check inner and outer position — a few slow stomach breaths',
              'Place cheek on cheek-piece and begin aiming',
              'Approach the target from 12 o\'clock',
              'Take the first trigger stage before the last exhale',
              'During exhale, barrel drifts to centre',
              'Stop breathing — squeeze trigger to release',
              'Follow-through: hold position for 1 second after shot',
              'Breathe normally, call the shot (estimate where you think it hit)',
              'Place rifle on stand, record or check result',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 pb-4 relative">
                <div className="absolute left-0 top-2 bottom-0 w-px bg-subtle" />
                <div className="w-5 h-5 rounded-full bg-elevated border border-border-subtle flex items-center
                                justify-center text-[10px] font-display font-bold text-[#F5A623] shrink-0 z-10">
                  {i + 1}
                </div>
                <p className="text-text-secondary text-[13px] pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          <Tip>
            Write your routine on paper and read it before each session. When you break your routine mid-shot (wrong breath count, distraction), lower the rifle and start again rather than forcing the shot.
          </Tip>

          {/* Analytics ↔ Technique mapping */}
          <SubHeading>Linking Analytics to Technique</SubHeading>
          <p className="text-text-secondary text-[13px] leading-relaxed mt-2">
            Use your session data to identify which technique area to work on:
          </p>
          <div className="mt-3 rounded-xl border border-border-subtle overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-elevated">
                  <th className="text-left py-2.5 px-4 label">What the data shows</th>
                  <th className="text-left py-2.5 px-4 label">Likely cause</th>
                  <th className="text-left py-2.5 px-4 label">Work on</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['MPI x < −0.3 (shots left)',         'Trigger pull direction or foot angle',   'Trigger control, foot position'],
                  ['MPI x > +0.3 (shots right)',        'Same as above, opposite direction',      'Trigger control, sight adjustment'],
                  ['MPI y < −0.3 (shots low)',          'Early exhale or premature trigger',      'Breathing timing, trigger timing'],
                  ['MPI y > +0.3 (shots high)',         'Flinch or tensing before shot',          'Follow-through, mental routine'],
                  ['Large group radius (> 5)',          'Unstable position or varying hold',      'Position stability, hold exercises'],
                  ['StdDev > 1.0',                     'Inconsistent trigger pressure',          'Dry-fire trigger drills'],
                  ['Later series drop by > 0.5',       'Fatigue or breathing lapses',            'Endurance training, breathing'],
                  ['First series lowest',              'Insufficient warm-up',                   'Warm-up routine, visualisation'],
                ].map(([data, cause, fix]) => (
                  <tr key={data as string} className="border-b border-border-subtle/50">
                    <td className="py-2.5 px-4 text-text-primary">{data}</td>
                    <td className="py-2.5 px-4 text-text-secondary">{cause}</td>
                    <td className="py-2.5 px-4 text-[#F5A623]">{fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </article>
      </div>
  );
}

// ── Wrapper with tabs ─────────────────────────────────────────────────────────

function DocsInner() {
  const [tab, setTab] = useTabParam('docs');
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="animate-slide-up">
        <h1 className="font-display font-bold text-2xl text-text-primary">Docs & Guides</h1>
        <p className="text-text-muted text-sm mt-1">Documentation and training guidance</p>
      </div>
      <TabBar tabs={[{ id: 'docs', label: 'Documentation' }, { id: 'guides', label: 'Guides' }]} active={tab} onChange={setTab} />
      {tab === 'docs' && <DocsContent />}
      {tab === 'guides' && <GuidanceSection />}
    </div>
  );
}

export default function DocsPage() {
  return (
    <AppShell title="Docs & Guides">
      <Suspense>
        <DocsInner />
      </Suspense>
    </AppShell>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IcoRocket() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1C7 1 2 4 2 8a5 5 0 0010 0c0-4-5-7-5-7z"/>
      <path d="M4.5 10.5L2 12M9.5 10.5L12 12"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function IcoGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="1" y="1" width="5" height="5" rx="1"/>
      <rect x="8" y="1" width="5" height="5" rx="1"/>
      <rect x="1" y="8" width="5" height="5" rx="1"/>
      <rect x="8" y="8" width="5" height="5" rx="1"/>
    </svg>
  );
}

function IcoTarget() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="7" cy="7" r="6"/>
      <circle cx="7" cy="7" r="3.5"/>
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function IcoChart() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M1 11l3-4 3 2 3-5 2 3"/>
    </svg>
  );
}

function IcoSparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1.5v2M7 10.5v2M1.5 7h2M10.5 7h2M3.3 3.3l1.4 1.4M9.3 9.3l1.4 1.4M3.3 10.7l1.4-1.4M9.3 4.7l1.4-1.4"/>
      <circle cx="7" cy="7" r="2" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function IcoLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 8.5a3 3 0 0 0 4 0l2-2a3.1 3.1 0 0 0-4-4L6.5 3.5"/>
      <path d="M8.5 5.5a3 3 0 0 0-4 0l-2 2a3.1 3.1 0 0 0 4 4L7.5 10.5"/>
    </svg>
  );
}

function IcoPeople() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="5" cy="5" r="2.5"/>
      <path d="M1 12c0-2.2 1.8-4 4-4"/>
      <circle cx="10" cy="5" r="2"/>
      <path d="M10 9c1.9.1 3.5 1.7 3.5 3.5"/>
    </svg>
  );
}

function IcoStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7,1 8.9,5 13,5.5 10,8.5 10.8,13 7,10.8 3.2,13 4,8.5 1,5.5 5.1,5"/>
    </svg>
  );
}

function IcoBook({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="2" y="1" width="10" height="12" rx="1.5"/>
      <path d="M5 4.5h4M5 7h4M5 9.5h2"/>
    </svg>
  );
}
