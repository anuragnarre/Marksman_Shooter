'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '../../components/AppShell';
import { useTabParam } from '../../components/ui/TabBar';
import { PlanningSectionNav } from '../../components/planning/PlanningSectionNav';

const CalendarSection = dynamic(
  () => import('../../components/planning/CalendarSection'),
  { ssr: false },
);
const GoalsSection = dynamic(
  () => import('../../components/planning/GoalsSection'),
  { ssr: false },
);

function PlanningInner() {
  const [tab] = useTabParam('schedule');

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="font-display font-bold text-2xl text-text-primary">Planning</h1>
        <p className="text-text-muted text-sm mt-1">
          Training schedule, goals, and personal records
        </p>
      </div>

      <PlanningSectionNav />

      {tab === 'schedule' && <CalendarSection />}
      {tab === 'goals' && <GoalsSection />}
    </div>
  );
}

export default function PlanningPage() {
  return (
    <AppShell title="Planning">
      <Suspense fallback={<div className="h-8 skeleton rounded-lg w-48" />}>
        <PlanningInner />
      </Suspense>
    </AppShell>
  );
}
