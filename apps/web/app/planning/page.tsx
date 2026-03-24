'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '../../components/AppShell';
import { TabBar, useTabParam } from '../../components/ui/TabBar';

const CalendarSection = dynamic(
  () => import('../../components/planning/CalendarSection'),
  { ssr: false },
);
const GoalsSection = dynamic(
  () => import('../../components/planning/GoalsSection'),
  { ssr: false },
);

const TABS = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'goals', label: 'Goals & Records' },
];

function PlanningInner() {
  const [tab, setTab] = useTabParam('schedule');

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="font-display font-bold text-2xl text-text-primary">Planning</h1>
        <p className="text-text-muted text-sm mt-1">
          Training schedule, goals, and personal records
        </p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'schedule' && <CalendarSection />}
      {tab === 'goals' && <GoalsSection />}
    </div>
  );
}

export default function PlanningPage() {
  return (
    <AppShell title="Planning">
      <Suspense>
        <PlanningInner />
      </Suspense>
    </AppShell>
  );
}
