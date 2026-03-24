// apps/web/app/connect/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/auth-context';
import type { CoachConnection, User } from '@shooting-platform/shared-types';

type CS = 'PENDING' | 'APPROVED' | 'REJECTED';

// ── Per-status contextual tokens ──────────────────────────────────────────────
const STATUS_COLOR: Record<CS, { text: string; border: string; bg: string; glow: string; dot: string }> = {
  PENDING:  {
    text:   'text-amber-400',
    border: 'border-amber-400/30',
    bg:     'bg-amber-400/10',
    glow:   'rgba(245,166,35,0.18)',
    dot:    'bg-[#F5A623]',
  },
  APPROVED: {
    text:   'text-[#00E5A0]',
    border: 'border-[#00E5A0]/30',
    bg:     'bg-[#00E5A0]/10',
    glow:   'rgba(0,229,160,0.14)',
    dot:    'bg-[#00E5A0]',
  },
  REJECTED: {
    text:   'text-[#FF4D6D]',
    border: 'border-[#FF4D6D]/30',
    bg:     'bg-[#FF4D6D]/10',
    glow:   'rgba(255,77,109,0.14)',
    dot:    'bg-[#FF4D6D]',
  },
};

const UNCONNECTED_GLOW = 'rgba(79,195,247,0.14)';

export default function ConnectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [coaches,     setCoaches]     = useState<User[]>([]);
  const [connections, setConnections] = useState<CoachConnection[]>([]);
  const [incoming,    setIncoming]    = useState<CoachConnection[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState<string | null>(null);
  const [acting,      setActing]      = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [newInvite,   setNewInvite]   = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Redirect non-SHOOTER roles — this page is SHOOTER-only
  useEffect(() => {
    if (user && user.role !== 'SHOOTER') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  function loadData() {
    Promise.all([
      apiFetch<User[]>('/coach/coaches'),
      apiFetch<CoachConnection[]>('/coach/my-connections'),
      apiFetch<CoachConnection[]>('/coach/incoming-invites'),
    ])
      .then(([c, conn, inv]) => {
        setCoaches(c);
        setConnections(conn);
        setIncoming(inv);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.role && user.role !== 'SHOOTER') return;
    loadData();
    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001');
    socketRef.current = socket;
    if (user?.id) socket.emit('joinUserRoom', user.id);
    socket.on('connection.invite',   () => { setNewInvite(true); loadData(); });
    socket.on('connection.accepted', () => loadData());
    socket.on('connection.declined', () => loadData());
    return () => {
      if (user?.id) socket.emit('leaveUserRoom', user.id);
      socket.disconnect();
    };
  }, [user?.id]);

  function getConnectionForCoach(coachId: string): CoachConnection | undefined {
    return connections.find((c) => c.coachId === coachId);
  }

  async function sendRequest(coachId: string) {
    setSending(coachId);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch('/coach/connect', { method: 'POST', body: JSON.stringify({ coachId }) });
      setSuccess('Connection request sent!');
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send request');
    } finally {
      setSending(null);
    }
  }

  async function approveInvite(connectionId: string) {
    setActing(connectionId);
    try {
      await apiFetch(`/coach/invite/${connectionId}/approve`, { method: 'PATCH' });
      setIncoming((prev) => prev.filter((i) => i.id !== connectionId));
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setActing(null);
    }
  }

  async function rejectInvite(connectionId: string) {
    setActing(connectionId);
    try {
      await apiFetch(`/coach/invite/${connectionId}/reject`, { method: 'PATCH' });
      setIncoming((prev) => prev.filter((i) => i.id !== connectionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setActing(null);
    }
  }

  return (
    <AppShell title="Connect">
      <div className="space-y-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="animate-slide-up">
          <h2 className="font-display font-bold text-2xl text-text-primary leading-tight">
            Coach Connections
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Browse coaches and send a request, or accept invitations from coaches who found you.
            Data is only shared once both sides confirm.
          </p>
        </div>

        {/* ── Toasts ───────────────────────────────────────────────────────── */}
        {error && (
          <div role="alert"
            className="flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.25)]
                       text-[#FF4D6D] text-sm animate-slide-down">
            <AlertIcon />
            {error}
          </div>
        )}
        {success && (
          <div role="status"
            className="flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-[rgba(0,229,160,0.06)] border border-[rgba(0,229,160,0.2)]
                       text-[#00E5A0] text-sm animate-slide-down">
            <span className="text-base leading-none">✓</span>
            {success}
          </div>
        )}

        {/* ── Incoming invites ─────────────────────────────────────────────── */}
        {(loading || incoming.length > 0) && (
          <section className="animate-slide-up">
            <div className="flex items-center gap-2.5 mb-4">
              <p className="label">Pending Invitations</p>
              {newInvite && incoming.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                                 bg-[#F5A623] text-[#080A0F] text-[10px] font-display font-bold
                                 animate-pulse shrink-0">
                  {incoming.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonCard height={80} animationDelay={0} />
                <SkeletonCard height={80} animationDelay={60} />
              </div>
            ) : (
              <div className="space-y-3">
                {incoming.map((inv, i) => (
                  <InviteCard
                    key={inv.id}
                    invite={inv}
                    acting={acting}
                    onApprove={approveInvite}
                    onReject={rejectInvite}
                    animDelay={i * 60}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Available coaches ────────────────────────────────────────────── */}
        <section className="animate-slide-up">
          <p className="label mb-4">Available Coaches</p>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} height={76} animationDelay={i * 60} />
              ))}
            </div>
          ) : coaches.length === 0 ? (
            <EmptyCoaches />
          ) : (
            <div className="space-y-3">
              {coaches.map((coach, i) => (
                <CoachCard
                  key={coach.id}
                  coach={coach}
                  connection={getConnectionForCoach(coach.id)}
                  sending={sending}
                  onRequest={sendRequest}
                  animDelay={i * 50}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Connections summary ──────────────────────────────────────────── */}
        {!loading && connections.length > 0 && (
          <section className="animate-slide-up">
            <p className="label mb-4">All Connections <span className="normal-case font-body text-text-muted ml-1">({connections.length})</span></p>
            <div className="rounded-xl border border-border-subtle overflow-hidden bg-surface">
              {/* Top accent line */}
              <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.4), transparent)' }} />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-3 px-5 label">Coach</th>
                    <th className="text-left py-3 px-5 label hidden sm:table-cell">Direction</th>
                    <th className="text-right py-3 px-5 label">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((conn) => {
                    const s = STATUS_COLOR[conn.status as CS];
                    return (
                      <tr key={conn.id} className="border-b border-border-subtle/50 table-row-hover">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                                            border ${s.border} ${s.bg}`}>
                              <span className={`font-display font-bold text-xs ${s.text}`}>
                                {conn.coach?.name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-text-primary font-medium text-sm leading-none">
                                {conn.coach?.name}
                              </p>
                              <p className="text-text-muted text-[11px] mt-0.5">{conn.coach?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 hidden sm:table-cell">
                          <span className="text-[10px] font-display uppercase tracking-wide text-text-muted">
                            {conn.initiatedBy === 'SHOOTER' ? 'You requested' : 'Coach invited'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <StatusPill status={conn.status as CS} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </AppShell>
  );
}

/* ── InviteCard ──────────────────────────────────────────────────────────── */

function InviteCard({
  invite, acting, onApprove, onReject, animDelay,
}: {
  invite: CoachConnection;
  acting: string | null;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  animDelay: number;
}) {
  const isActing = acting === invite.id;

  return (
    <div
      className="group relative rounded-xl border border-[rgba(79,195,247,0.25)]
                 bg-surface overflow-hidden transition-all duration-300
                 hover:border-[rgba(79,195,247,0.5)] animate-slide-up"
      style={{
        animationDelay: `${animDelay}ms`,
        boxShadow: '0 0 0 0 rgba(79,195,247,0)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px -6px rgba(79,195,247,0.25)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 rgba(79,195,247,0)';
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#4FC3F7]" />

      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ background: 'linear-gradient(90deg, transparent, #4FC3F7, transparent)' }} />

      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-[rgba(79,195,247,0.08)]
                        border border-[rgba(79,195,247,0.3)]
                        flex items-center justify-center shrink-0">
          <span className="text-[#4FC3F7] font-display font-bold text-base">
            {invite.coach?.name?.charAt(0)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-text-primary font-semibold text-sm truncate">
              {invite.coach?.name}
            </p>
            <StatusBadge variant="coach" size="sm" />
          </div>
          <p className="text-text-muted text-[11px] truncate mt-0.5">{invite.coach?.email}</p>
          <p className="text-[#4FC3F7] text-[10px] mt-1 font-display uppercase tracking-widest">
            Wants to coach you
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onApprove(invite.id)}
            disabled={isActing}
            className="btn btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
          >
            {isActing ? '…' : 'Accept'}
          </button>
          <button
            onClick={() => onReject(invite.id)}
            disabled={isActing}
            className="text-xs px-3 py-1.5 rounded-lg border border-border-subtle
                       text-text-secondary hover:text-[#FF4D6D] hover:border-[rgba(255,77,109,0.4)]
                       transition-colors font-display uppercase tracking-wide disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── CoachCard ───────────────────────────────────────────────────────────── */

function CoachCard({
  coach, connection, sending, onRequest, animDelay,
}: {
  coach:      User;
  connection: CoachConnection | undefined;
  sending:    string | null;
  onRequest:  (id: string) => void;
  animDelay:  number;
}) {
  const isSending = sending === coach.id;
  const status    = connection?.status as CS | undefined;

  // Contextual color based on connection state
  const ctx = status ? STATUS_COLOR[status] : null;
  const borderColor  = ctx ? `rgba(${status === 'APPROVED' ? '0,229,160' : status === 'PENDING' ? '245,166,35' : '255,77,109'}, 0.3)` : 'rgba(79,195,247,0.2)';
  const hoverBorder  = ctx ? `rgba(${status === 'APPROVED' ? '0,229,160' : status === 'PENDING' ? '245,166,35' : '255,77,109'}, 0.55)` : 'rgba(79,195,247,0.5)';
  const glowColor    = ctx ? ctx.glow : UNCONNECTED_GLOW;
  const topLineColor = ctx
    ? (status === 'APPROVED' ? '#00E5A0' : status === 'PENDING' ? '#F5A623' : '#FF4D6D')
    : '#4FC3F7';
  const avatarBg     = ctx ? ctx.bg    : 'rgba(79,195,247,0.08)';
  const avatarBorder = ctx ? `${ctx.border.replace('border-', '')}` : 'rgba(79,195,247,0.3)';
  const avatarText   = ctx ? ctx.text  : 'text-[#4FC3F7]';

  return (
    <div
      className="group relative rounded-xl bg-surface overflow-hidden
                 transition-all duration-300 animate-slide-up"
      style={{
        border: `1px solid ${borderColor}`,
        animationDelay: `${animDelay}ms`,
        boxShadow: '0 0 0 0 transparent',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.border = `1px solid ${hoverBorder}`;
        el.style.boxShadow = `0 0 24px -6px ${glowColor}`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.border = `1px solid ${borderColor}`;
        el.style.boxShadow = '0 0 0 0 transparent';
      }}
    >
      {/* Top accent glow line */}
      <div
        className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${topLineColor}, transparent)` }}
      />

      {/* Background glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 20% 50%, ${glowColor} 0%, transparent 65%)` }}
      />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: avatarBg, border: `1px solid ${avatarBorder}` }}
        >
          <span className={`font-display font-bold text-base ${avatarText}`}>
            {coach.name.charAt(0)}
          </span>
        </div>

        {/* Name / email */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-text-primary font-semibold text-sm truncate">{coach.name}</p>
            <StatusBadge variant="coach" size="sm" />
          </div>
          <p className="text-text-muted text-[11px] truncate mt-0.5">{coach.email}</p>
        </div>

        {/* Action / status */}
        <div className="shrink-0">
          {connection ? (
            <div className="flex flex-col items-end gap-1">
              <StatusPill status={connection.status as CS} />
              {connection.initiatedBy === 'COACH' && connection.status === 'PENDING' && (
                <span className="text-[9px] text-[#4FC3F7] font-display uppercase tracking-wide">
                  Coach invited you
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => onRequest(coach.id)}
              disabled={isSending}
              className="btn btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
            >
              {isSending ? 'Sending…' : 'Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── StatusPill ──────────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: CS }) {
  const s = STATUS_COLOR[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded
                      text-[10px] font-display font-bold uppercase tracking-widest
                      border ${s.border} ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status === 'PENDING' ? 'Pending' : status === 'APPROVED' ? 'Approved' : 'Rejected'}
    </span>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

function EmptyCoaches() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-12
                    flex flex-col items-center text-center animate-fade-in">
      <svg width="52" height="52" viewBox="0 0 52 52" className="mb-5 opacity-20" aria-hidden="true">
        <circle cx="26" cy="18" r="10" stroke="#F5A623" strokeWidth="1.5" fill="none" />
        <path d="M8 44c0-9.9 8.1-18 18-18s18 8.1 18 18"
              stroke="#4FC3F7" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      </svg>
      <p className="text-text-primary font-display font-bold text-lg">No coaches registered yet</p>
      <p className="text-text-muted text-sm mt-1.5">
        Coaches will appear here once they create an account.
      </p>
    </div>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 1.5L13 12H1z" />
      <line x1="7" y1="6" x2="7" y2="8.5" />
      <circle cx="7" cy="10.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
