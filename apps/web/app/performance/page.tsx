'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '../../components/AppShell';
import { TabBar, useTabParam } from '../../components/ui/TabBar';

const PerformanceOverview = dynamic(
  () => import('../../components/performance/PerformanceOverview'),
  { ssr: false },
);
const AnalyticsSection = dynamic(
  () => import('../../components/performance/AnalyticsSection'),
  { ssr: false },
);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analytics', label: 'Analytics' },
];

function PerformanceInner() {
  const [tab, setTab] = useTabParam('overview');

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="animate-slide-up">
        <h1 className="font-display font-bold text-2xl text-text-primary">Performance</h1>
        <p className="text-text-muted text-sm mt-1">
          Heatmaps, analytics, fatigue trends, and deep analysis
        </p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && <PerformanceOverview />}
      {tab === 'analytics' && <AnalyticsSection />}
    </div>
  );
}

export default function PerformancePage() {
  return (
    <AppShell title="Performance">
      <Suspense>
        <PerformanceInner />
      </Suspense>
    </AppShell>
  );
}
