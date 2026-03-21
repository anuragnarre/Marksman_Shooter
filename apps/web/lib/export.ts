// apps/web/lib/export.ts — Data export utilities

import type { Shot, Session, AnalyticsResult } from '@shooting-platform/shared-types';

/**
 * Export shots data as CSV and trigger browser download.
 */
export function exportShotsCSV(shots: Shot[], session?: Session | null) {
  const header = 'Shot #,Score,X,Y\n';
  const rows = shots
    .sort((a, b) => a.shotNumber - b.shotNumber)
    .map(s => `${s.shotNumber},${s.score},${s.x ?? ''},${s.y ?? ''}`)
    .join('\n');

  const prefix = session
    ? `# Session: ${session.discipline} - ${session.weaponType}\n# Date: ${new Date(session.sessionDate).toLocaleDateString()}\n# Distance: ${session.distance}m\n\n`
    : '';

  download(`${prefix}${header}${rows}`, getFilename(session, 'shots', 'csv'), 'text/csv');
}

/**
 * Export session analytics as CSV.
 */
export function exportAnalyticsCSV(analytics: AnalyticsResult, session?: Session | null) {
  const lines = [
    'Metric,Value',
    `Total Shots,${analytics.totalShots}`,
    `Average Score,${analytics.averageScore.toFixed(2)}`,
    `Max Score,${analytics.maxScore.toFixed(1)}`,
    `Standard Deviation,${analytics.stdDev.toFixed(3)}`,
    `Group Radius,${analytics.groupRadius.toFixed(2)}`,
    `MPI X,${analytics.mpi.x.toFixed(2)}`,
    `MPI Y,${analytics.mpi.y.toFixed(2)}`,
  ];

  if (analytics.seriesAverages?.length) {
    lines.push('');
    lines.push('Series,Average');
    analytics.seriesAverages.forEach((avg, i) => {
      lines.push(`Series ${i + 1},${avg.toFixed(2)}`);
    });
  }

  download(lines.join('\n'), getFilename(session, 'analytics', 'csv'), 'text/csv');
}

/**
 * Export session data as JSON.
 */
export function exportSessionJSON(session: Session, analytics?: AnalyticsResult | null) {
  const data = {
    session: {
      id: session.id,
      discipline: session.discipline,
      weaponType: session.weaponType,
      distance: session.distance,
      date: session.sessionDate,
      shots: (session.shots ?? []).map((s: Shot) => ({
        shotNumber: s.shotNumber,
        score: s.score,
        x: s.x,
        y: s.y,
      })),
    },
    analytics: analytics
      ? {
          averageScore: analytics.averageScore,
          maxScore: analytics.maxScore,
          stdDev: analytics.stdDev,
          groupRadius: analytics.groupRadius,
          mpi: analytics.mpi,
          seriesAverages: analytics.seriesAverages,
        }
      : undefined,
  };

  download(
    JSON.stringify(data, null, 2),
    getFilename(session, 'session', 'json'),
    'application/json',
  );
}

function getFilename(session: Session | null | undefined, type: string, ext: string): string {
  const date = session
    ? new Date(session.sessionDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const disc = session?.discipline?.replace(/\s+/g, '-').toLowerCase() ?? 'session';
  return `marksman-${disc}-${type}-${date}.${ext}`;
}

function download(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
