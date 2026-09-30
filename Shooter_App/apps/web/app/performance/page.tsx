'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { useTabParam } from '../../components/ui/TabBar';
import { PerformanceSectionNav } from '../../components/performance/PerformanceSectionNav';

const PerformanceOverview = dynamic(
  () => import('../../components/performance/PerformanceOverview'),
  { ssr: false },
);
const AnalyticsSection = dynamic(
  () => import('../../components/performance/AnalyticsSection'),
  { ssr: false },
);

function PerformanceInner() {
  const [tab] = useTabParam('overview');

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="animate-slide-up">
        <h1 className="font-display font-bold text-2xl text-text-primary">Performance</h1>
        <p className="text-text-muted text-sm mt-1">
          Heatmaps, analytics, fatigue trends, and deep analysis
        </p>
      </div>

      <PerformanceSectionNav />

      {tab === 'overview' && (
        <>
          <PerformanceOverview />
          {/* Quick-access cards to sub-sections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
            <SubSectionCard
              href="/performance/ai-coach"
              title="AI Coach"
              description="Session-level analysis powered by Claude Opus 4.6"
              color="#F5A623"
              icon={<SparkleIcon />}
            />
            <SubSectionCard
              href="/performance/ai-assistant"
              title="AI Assistant"
              description="Cross-session technique and performance patterns"
              color="#4FC3F7"
              icon={<BrainIcon />}
            />
            <SubSectionCard
              href="/performance/health"
              title="Health"
              description="Biometric monitoring, heart rate and SpO₂ trends"
              color="#00E5A0"
              icon={<HeartIcon />}
            />
          </div>
        </>
      )}
      {tab === 'analytics' && <AnalyticsSection />}
    </div>
  );
}

function SubSectionCard({
  href, title, description, color, icon,
}: {
  href: string; title: string; description: string; color: string; icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="card p-5 flex items-start gap-4 transition-all duration-200 group"
      style={{ textDecoration: 'none' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
        (e.currentTarget as HTMLElement).style.background = `${color}06`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '';
        (e.currentTarget as HTMLElement).style.background = '';
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="font-display font-semibold text-sm text-text-primary group-hover:text-text-primary">
          {title}
        </p>
        <p className="text-text-muted text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" className="ml-auto shrink-0 mt-1 text-text-muted
        group-hover:text-text-secondary transition-colors"
      >
        <polyline points="5,3 9,7 5,11" />
      </svg>
    </Link>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" />
      <circle cx="9" cy="9" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.7 2.9-1.8 3.8A5.002 5.002 0 0 1 12 22a5.002 5.002 0 0 1-3.2-11.2A5.002 5.002 0 0 1 12 2z" />
      <path d="M12 2v20" />
      <path d="M8.5 6.5C7 7.5 7 9.5 8 11" />
      <path d="M15.5 6.5c1.5 1 1.5 3 .5 4.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 15.5l-5.5-5.5C2 8.5 2 6 3.5 4.5S7.5 3 9 5c1.5-2 4-2 5.5-.5S16 8.5 14.5 10L9 15.5z" />
      <polyline points="4,9 7,9 8,7 10,11 11,9 14,9" />
    </svg>
  );
}

export default function PerformancePage() {
  return (
    <AppShell title="Performance">
      <Suspense fallback={<div className="h-8 skeleton rounded-lg w-48" />}>
        <PerformanceInner />
      </Suspense>
    </AppShell>
  );
}
