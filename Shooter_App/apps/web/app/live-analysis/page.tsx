import { Metadata } from 'next';
import { LiveAnalysisDashboard } from './LiveAnalysisDashboard';
import { AppShell } from '../../components/AppShell';

export const metadata: Metadata = {
  title: 'Live Target Analysis — Marksman',
  description: 'Real-time telemetry and target analysis for airgun shooting.',
};

export default function LiveAnalysisPage() {
  return (
    <AppShell title="Live Analysis">
      <div className="space-y-6 pb-8">
        <header className="mb-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-text-primary">
            Live Analysis
          </h1>
          <p className="font-body text-text-secondary mt-1.5 text-sm sm:text-base">
            Real-time telemetry and grouping analysis for standardized targets.
          </p>
        </header>

        <LiveAnalysisDashboard />
      </div>
    </AppShell>
  );
}
