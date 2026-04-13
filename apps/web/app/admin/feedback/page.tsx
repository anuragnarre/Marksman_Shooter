'use client';

// /admin/feedback — feedback viewer.
// Accessible only to ashwin.hingave123@gmail.com.

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/auth-context';

const ADMIN_EMAIL = 'ashwin.hingave123@gmail.com';

interface FeedbackEntry {
  id: string;
  role: string;
  ratings: Record<string, number>;
  texts: Record<string, string>;
  at: string;
}

const RATING_LABELS: Record<string, string> = {
  // shooter
  training_quality:   'Training Quality',
  session_experience: 'App Experience',
  ai_accuracy:        'AI Accuracy',
  // coach
  athlete_management: 'Athlete Management',
  reporting_quality:  'Reporting & Analysis',
  team_features:      'Team Features',
};

const TEXT_LABELS: Record<string, string> = {
  feature_request: 'Feature Requests',
  workflow:        'Workflow Improvements',
};

function RatingPill({ value }: { value: number }) {
  const label = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value] ?? '—';
  const color =
    value >= 5 ? '#00E5A0' :
    value >= 4 ? '#4FC3F7' :
    value >= 3 ? '#F5A623' :
    '#FF4D6D';
  return (
    <span
      className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {'★'.repeat(value)}{'☆'.repeat(5 - value)} {label}
    </span>
  );
}

function EntryCard({ entry }: { entry: FeedbackEntry }) {
  const date = new Date(entry.at);
  const avgRating =
    Object.values(entry.ratings).length > 0
      ? (Object.values(entry.ratings).reduce((a, b) => a + b, 0) / Object.values(entry.ratings).length).toFixed(1)
      : '—';

  return (
    <div
      className="rounded-xl p-4 space-y-3 animate-fade-up"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide"
            style={{
              color: entry.role === 'COACH' ? '#4FC3F7' : '#F5A623',
              background: entry.role === 'COACH' ? 'rgba(79,195,247,0.1)' : 'rgba(245,166,35,0.1)',
              border: `1px solid ${entry.role === 'COACH' ? 'rgba(79,195,247,0.2)' : 'rgba(245,166,35,0.2)'}`,
            }}
          >
            {entry.role}
          </span>
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {entry.id}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
            avg {avgRating}/5
          </span>
          <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {Object.entries(entry.ratings).map(([key, val]) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="font-body text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {RATING_LABELS[key] ?? key}
            </span>
            <RatingPill value={val} />
          </div>
        ))}
      </div>

      {/* Text responses */}
      {Object.entries(entry.texts).filter(([, v]) => v.trim()).map(([key, val]) => (
        <div key={key} className="space-y-1">
          <p className="font-body text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {TEXT_LABELS[key] ?? key}
          </p>
          <p
            className="font-body text-sm rounded-lg px-3 py-2"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          >
            {val}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function FeedbackAdminPage() {
  const { user, isLoading } = useAuth();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<'ALL' | 'SHOOTER' | 'COACH'>('ALL');

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isLoading || !isAdmin) { setLoading(false); return; }
    fetch('/api/feedback')
      .then(r => r.json())
      .then((data: FeedbackEntry[]) => {
        setEntries(data.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()));
      })
      .catch(() => setError('Failed to load feedback.'))
      .finally(() => setLoading(false));
  }, [isLoading, isAdmin]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <div className="space-y-3 w-80">
          <div className="skeleton h-8 w-48 mx-auto" />
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <div className="text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4D6D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl tracking-wide" style={{ color: 'var(--text-primary)' }}>
            Access Denied
          </h1>
          <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
            This page is restricted to administrators.
          </p>
        </div>
      </div>
    );
  }

  const filtered = filter === 'ALL' ? entries : entries.filter(e => e.role === filter);
  const shooterCount = entries.filter(e => e.role === 'SHOOTER').length;
  const coachCount   = entries.filter(e => e.role === 'COACH').length;
  const allAvg = entries.length > 0
    ? (entries.flatMap(e => Object.values(e.ratings)).reduce((a, b) => a + b, 0) /
       entries.flatMap(e => Object.values(e.ratings)).length).toFixed(2)
    : '—';

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Feedback Inbox
            </h1>
            <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Admin view · {user?.email}
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetch('/api/feedback')
                .then(r => r.json())
                .then((data: FeedbackEntry[]) =>
                  setEntries(data.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()))
                )
                .catch(() => setError('Failed to refresh.'))
                .finally(() => setLoading(false));
            }}
            className="font-body text-sm px-4 py-2 rounded-lg transition-all active:scale-95"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Refresh
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Submissions', value: entries.length.toString() },
            { label: 'Avg Rating',        value: `${allAvg}/5` },
            { label: 'Shooter',           value: shooterCount.toString() },
            { label: 'Coach',             value: coachCount.toString() },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </p>
              <p className="font-mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['ALL', 'SHOOTER', 'COACH'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-body text-sm px-4 py-1.5 rounded-lg transition-all"
              style={filter === f
                ? { background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--accent-primary)' }
                : { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
              {f === 'ALL' ? `All (${entries.length})` : f === 'SHOOTER' ? `Shooter (${shooterCount})` : `Coach (${coachCount})`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="font-body text-sm" style={{ color: '#FF4D6D' }}>{error}</p>
        )}

        {/* Entries */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
              No feedback submitted yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {filtered.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
