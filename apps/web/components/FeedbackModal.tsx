// apps/web/components/FeedbackModal.tsx
'use client';

// Role-aware feedback modal.
// SHOOTER: training quality, session UX, AI accuracy, feature request.
// COACH:   athlete management, reporting quality, team features, workflow.

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/auth-context';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Question schema ───────────────────────────────────────────────────────────

interface RatingQuestion {
  kind: 'rating';
  id: string;
  label: string;
  hint: string;
}
interface TextQuestion {
  kind: 'text';
  id: string;
  label: string;
  placeholder: string;
}
type Question = RatingQuestion | TextQuestion;

const SHOOTER_QUESTIONS: Question[] = [
  { kind: 'rating', id: 'training_quality',   label: 'Training Session Quality',  hint: "How well did today's session meet your training goals?" },
  { kind: 'rating', id: 'session_experience', label: 'App Experience',             hint: 'How smooth was recording and reviewing your session?' },
  { kind: 'rating', id: 'ai_accuracy',        label: 'AI Coaching Accuracy',       hint: 'How relevant and accurate was the AI feedback?' },
  { kind: 'text',   id: 'feature_request',    label: 'Feature Requests',           placeholder: 'What would make Marksman more useful for you?' },
];

const COACH_QUESTIONS: Question[] = [
  { kind: 'rating', id: 'athlete_management', label: 'Athlete Management',  hint: 'How easy was it to track and manage your athletes?' },
  { kind: 'rating', id: 'reporting_quality',  label: 'Reporting & Analysis', hint: 'How useful were the analytics and session reports?' },
  { kind: 'rating', id: 'team_features',      label: 'Team Features',        hint: 'How well do the team tools support your coaching workflow?' },
  { kind: 'text',   id: 'workflow',           label: 'Workflow Improvements', placeholder: 'What would improve your coaching workflow most?' },
];

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5" role="group">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        const isHovered = n <= hover && hover > 0;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-all duration-150 active:scale-90"
            aria-label={`${n} star`}
          >
            <svg width="26" height="26" viewBox="0 0 24 24"
              fill={filled ? '#F5A623' : 'none'}
              stroke={filled ? '#F5A623' : 'rgba(180,180,180,0.6)'}
              strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{
                filter: filled ? 'drop-shadow(0 0 6px rgba(245,166,35,0.55))' : 'none',
                transition: 'all 0.15s',
                opacity: isHovered ? 1 : filled ? 1 : 0.7,
              }}>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </button>
        );
      })}
      {value > 0 && (
        <span className="font-mono text-[11px] font-semibold ml-1.5 px-2 py-0.5 rounded-md"
          style={{ color: '#F5A623', background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}>
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const questions = user?.role === 'COACH' ? COACH_QUESTIONS : SHOOTER_QUESTIONS;

  const [ratings,   setRatings]   = useState<Record<string, number>>({});
  const [texts,     setTexts]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const ratingQuestions = questions.filter((q): q is RatingQuestion => q.kind === 'rating');
  const allRated = ratingQuestions.every(q => (ratings[q.id] ?? 0) > 0);

  const handleClose = useCallback(() => {
    // Reset on close so next open is fresh
    setRatings({});
    setTexts({});
    setSubmitted(false);
    setSubmitError(null);
    onClose();
  }, [onClose]);

  async function handleSubmit() {
    if (!allRated) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role:    user?.role ?? 'SHOOTER',
          ratings,
          texts,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
    } catch {
      setSubmitError('Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl flex flex-col overflow-hidden
                   animate-fade-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,166,35,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
          maxHeight: '90dvh',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center gap-3">
            {/* Feedback icon */}
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)' }}
            >
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="#F5A623"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H2a1 1 0 00-1 1v7a1 1 0 001 1h3l2.5 2.5L10 11h3a1 1 0 001-1V3a1 1 0 00-1-1z"/>
                <line x1="4.5" y1="5.5" x2="10.5" y2="5.5"/>
                <line x1="4.5" y1="8" x2="7.5" y2="8"/>
              </svg>
            </span>
            <div>
              <h2 className="font-display font-bold text-base tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Share Your Feedback
              </h2>
              <p className="font-body text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {user?.role === 'COACH' ? 'Coach perspective' : 'Athlete perspective'} · takes ~60s
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            aria-label="Close feedback"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
            </svg>
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">

          {submitted ? (
            // ── Thank you state ───────────────────────────────────────────
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <span
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)' }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </span>
              <div>
                <p className="font-display font-bold text-lg tracking-wide" style={{ color: 'var(--text-primary)' }}>Thank you!</p>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Your feedback helps us improve Marksman.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="mt-2 font-body text-sm font-semibold px-6 py-2.5 rounded-xl transition-all active:scale-95"
                style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.3)', color: '#00E5A0' }}
              >
                Close
              </button>
            </div>
          ) : (
            // ── Questions ────────────────────────────────────────────────
            questions.map((q, i) => (
              <div key={q.id} className="space-y-2 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <label className="font-display font-semibold text-[13px] tracking-wide block" style={{ color: 'var(--text-primary)' }}>
                  {q.label}
                  {q.kind === 'rating' && (
                    <span style={{ color: '#FF4D6D' }} className="ml-0.5">*</span>
                  )}
                </label>
                {q.kind === 'rating' && (
                  <>
                    <p className="font-body text-[12px] -mt-1" style={{ color: 'var(--text-secondary)' }}>{q.hint}</p>
                    <StarRating
                      value={ratings[q.id] ?? 0}
                      onChange={(v) => setRatings(prev => ({ ...prev, [q.id]: v }))}
                    />
                  </>
                )}
                {q.kind === 'text' && (
                  <textarea
                    value={texts[q.id] ?? ''}
                    onChange={(e) => setTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={q.placeholder}
                    rows={3}
                    className="w-full resize-none rounded-xl px-4 py-3 font-body text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(245,166,35,0.5)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.08)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {!submitted && (
          <div
            className="px-5 py-4 shrink-0 flex items-center justify-between gap-3"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            {submitError && (
              <p className="font-body text-xs flex-1 font-medium" style={{ color: '#FF4D6D' }}>{submitError}</p>
            )}
            {!submitError && (
              <p className="font-body text-[12px] flex-1" style={{ color: allRated ? 'var(--text-secondary)' : 'var(--text-secondary)' }}>
                {allRated
                  ? <span style={{ color: '#00E5A0' }}>✓ Ready to submit</span>
                  : 'Rate all items to continue.'}
              </p>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleClose}
                className="font-body text-sm px-4 py-2 rounded-xl transition-all duration-150 active:scale-95"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allRated || submitting}
                className="font-body text-sm font-semibold px-5 py-2 rounded-xl
                           transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: allRated && !submitting ? 'linear-gradient(135deg, #F5A623 0%, #E8961A 100%)' : 'var(--bg-elevated)',
                  color: allRated && !submitting ? '#060810' : 'var(--text-secondary)',
                  border: allRated && !submitting ? '1px solid rgba(245,166,35,0.3)' : '1px solid var(--border-default)',
                  boxShadow: allRated && !submitting ? '0 0 18px rgba(245,166,35,0.35)' : 'none',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
