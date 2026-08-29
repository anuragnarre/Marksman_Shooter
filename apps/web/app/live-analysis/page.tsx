import { Metadata } from 'next';
import { LiveAnalysisDashboard } from './LiveAnalysisDashboard';

export const metadata: Metadata = {
  title: 'Live Target Analysis — Marksman',
  description: 'Real-time telemetry and target analysis for airgun shooting.',
};

export default function LiveAnalysisPage() {
  return (
    <main className="min-h-screen bg-bg-void pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-wide text-text-primary">
            Live Analysis
          </h1>
          <p className="font-body text-text-secondary mt-2">
            Real-time telemetry and grouping analysis for standardized targets.
          </p>
        </header>

        <LiveAnalysisDashboard />
      </div>
    </main>
  );
}
