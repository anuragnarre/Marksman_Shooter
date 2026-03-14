// apps/web/app/coach/shooters/page.tsx
'use client';

// Coach's shooter management page.
// Three connection panels:
//   1. "Incoming Requests" — shooter-initiated pending requests the coach must approve/reject.
//   2. "Find & Invite a Shooter" — coach searches by email and sends an invite.
//   3. "Sent Invitations" — outgoing coach-initiated invites with status + cancel option.
// Then the connected-shooters grid and session viewer.

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppShell } from '../../../components/AppShell';
import { apiFetch } from '../../../lib/api';
import { formatSessionStart } from '../../../lib/session-time';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SkeletonCard, SkeletonRow } from '../../../components/ui/SkeletonCard';
import { useAuth } from '../../../contexts/auth-context';
import type {
  CoachConnection,
  CoachShooterPerformanceSummary,
  CreateManagedShooterProfileRequest,
  Session,
  UpdateManagedShooterProfileRequest,
  User,
} from '@shooting-platform/shared-types';

type Tier = 'gold' | 'silver' | 'bronze' | 'default';
function getTier(sessions: Session[]): Tier {
  const shots = sessions.flatMap((s) => s.shots ?? []);
  if (!shots.length) return 'default';
  const avg = shots.reduce((a, b) => a + (b as { score: number }).score, 0) / shots.length;
  if (avg >= 9.5) return 'gold';
  if (avg >= 9.0) return 'silver';
  if (avg >= 8.0) return 'bronze';
  return 'default';
}
const TIER_RING: Record<Tier, string> = {
  gold: 'border-accent shadow-glow-sm', silver: 'border-[#8892A4]',
  bronze: 'border-[#cd7f32]',           default: 'border-[#1E2433]',
};
const TIER_LABEL: Record<Tier, string | null> = {
  gold: 'Gold', silver: 'Silver', bronze: 'Bronze', default: null,
};

type InviteStatus = 'PENDING' | 'REJECTED';
const INVITE_STYLE: Record<InviteStatus, string> = {
  PENDING:  'text-amber-400 border-amber-400/30 bg-amber-400/10',
  REJECTED: 'text-[#FF4D6D] border-[#FF4D6D]/30 bg-[#FF4D6D]/10',
};

function parseQuickScores(input: string): Array<{ shotNumber: number; score: number; x: number; y: number }> {
  const values = input
    .split(/[\s,]+/)
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));

  return values.map((score, idx) => ({
    shotNumber: idx + 1,
    score: Math.max(0, Math.min(10.9, score)),
    x: 0,
    y: 0,
  }));
}

export default function CoachShootersPage() {
  const { user } = useAuth();

  // ── State ─────────────────────────────────────────────────────────────────
  const [shooters,        setShooters]        = useState<User[]>([]);
  const [selectedShooter, setSelectedShooter] = useState<User | null>(null);
  const [sessions,        setSessions]        = useState<Session[]>([]);
  const [loadingShooters, setLoadingShooters] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [requests,        setRequests]        = useState<CoachConnection[]>([]);
  const [outgoing,        setOutgoing]        = useState<CoachConnection[]>([]);
  const [loadingReqs,     setLoadingReqs]     = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [newRequest,      setNewRequest]      = useState(false); // WS badge
  const [performance,     setPerformance]     = useState<CoachShooterPerformanceSummary | null>(null);
  const [managedCreate,   setManagedCreate]   = useState<CreateManagedShooterProfileRequest>({
    name: '',
    shooterCode: '',
    primaryWeapon: '',
  });
  const [managedEdit,     setManagedEdit]     = useState<UpdateManagedShooterProfileRequest>({
    name: '',
    shooterCode: '',
    primaryWeapon: '',
  });
  const [creatingManaged, setCreatingManaged] = useState(false);
  const [savingManaged,   setSavingManaged]   = useState(false);
  const [managedMsg,      setManagedMsg]      = useState<string | null>(null);
  const [sessionMsg,      setSessionMsg]      = useState<string | null>(null);
  const [sessionBusy,     setSessionBusy]     = useState(false);
  const [sessionForm,     setSessionForm]     = useState({
    discipline: '10m Air Rifle',
    distance: 10,
    weaponType: '',
    numberOfShots: 10,
    sessionDate: new Date().toISOString().slice(0, 16),
    trainingMode: '',
  });
  const [quickScores, setQuickScores] = useState('');

  // Invite panel
  const [inviteEmail,      setInviteEmail]      = useState('');
  const [searching,        setSearching]        = useState(false);
  const [foundShooter,     setFoundShooter]     = useState<User | null | 'not-found'>('not-found');
  const [inviteSending,    setInviteSending]    = useState(false);
  const [inviteSuccess,    setInviteSuccess]    = useState<string | null>(null);
  const [inviteError,      setInviteError]      = useState<string | null>(null);
  const [panelOpen,        setPanelOpen]        = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────────

  function loadData() {
    Promise.all([
      apiFetch<User[]>('/coach/shooters'),
      apiFetch<User[]>('/coach/managed-shooters').catch(() => [] as User[]),
      apiFetch<CoachConnection[]>('/coach/requests'),
      apiFetch<CoachConnection[]>('/coach/outgoing-invites'),
    ])
      .then(([connected, managed, reqs, out]) => {
        const byId = new Map<string, User>();
        for (const shooter of connected) byId.set(shooter.id, shooter);
        for (const managedShooter of managed) {
          byId.set(managedShooter.id, {
            ...byId.get(managedShooter.id),
            ...managedShooter,
            shooterProfile: managedShooter.shooterProfile ?? byId.get(managedShooter.id)?.shooterProfile,
          });
        }

        setShooters(Array.from(byId.values()));
        setRequests(reqs);
        setOutgoing(out);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        setLoadingShooters(false);
        setLoadingReqs(false);
      });
  }

  useEffect(() => {
    loadData();

    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001');
    socketRef.current = socket;
    if (user?.id) socket.emit('joinUserRoom', user.id);

    // Shooter sent us a request
    socket.on('connection.invite', () => { setNewRequest(true); loadData(); });
    // Shooter responded to our invite
    socket.on('connection.accepted', () => loadData());
    socket.on('connection.declined', () => loadData());

    return () => {
      if (user?.id) socket.emit('leaveUserRoom', user.id);
      socket.disconnect();
    };
  }, [user?.id]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleApprove(connectionId: string) {
    try {
      await apiFetch(`/coach/connect/${connectionId}/approve`, { method: 'PATCH' });
      setNewRequest(false);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve');
    }
  }

  async function handleReject(connectionId: string) {
    try {
      await apiFetch(`/coach/connect/${connectionId}/reject`, { method: 'PATCH' });
      setRequests((prev) => prev.filter((r) => r.id !== connectionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject');
    }
  }

  async function handleSearch() {
    if (!inviteEmail.trim()) return;
    setSearching(true);
    setFoundShooter('not-found');
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const shooter = await apiFetch<User | null>(
        `/coach/shooters/search?email=${encodeURIComponent(inviteEmail.trim())}`,
      );
      setFoundShooter(shooter ?? null);
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleInvite(shooterId: string) {
    setInviteSending(true);
    setInviteError(null);
    try {
      await apiFetch('/coach/invite', {
        method: 'POST',
        body: JSON.stringify({ shooterId }),
      });
      setInviteSuccess('Invitation sent! The shooter will be notified.');
      setInviteEmail('');
      setFoundShooter('not-found');
      loadData();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Failed to send invitation');
    } finally {
      setInviteSending(false);
    }
  }

  async function handleCancelInvite(connectionId: string) {
    try {
      await apiFetch(`/coach/invite/${connectionId}`, { method: 'DELETE' });
      setOutgoing((prev) => prev.filter((o) => o.id !== connectionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel invite');
    }
  }

  async function handleCreateManagedProfile() {
    if (!managedCreate.name.trim() || !managedCreate.shooterCode.trim()) return;

    setManagedMsg(null);
    setCreatingManaged(true);
    try {
      const created = await apiFetch<User>('/coach/managed-shooters', {
        method: 'POST',
        body: JSON.stringify({
          name: managedCreate.name.trim(),
          shooterCode: managedCreate.shooterCode.trim().toUpperCase(),
          primaryWeapon: managedCreate.primaryWeapon?.trim() || undefined,
        }),
      });
      setManagedCreate({ name: '', shooterCode: '', primaryWeapon: '' });
      setManagedMsg(`Managed profile created for ${created.name}.`);
      loadData();
    } catch (e) {
      setManagedMsg(e instanceof Error ? e.message : 'Failed to create managed profile');
    } finally {
      setCreatingManaged(false);
    }
  }

  async function handleSaveManagedProfile() {
    if (!selectedShooter || !selectedShooter.shooterProfile?.isManaged) return;
    if (!managedEdit.name?.trim() || !managedEdit.shooterCode?.trim()) return;

    setManagedMsg(null);
    setSavingManaged(true);
    try {
      const updated = await apiFetch<User>(`/coach/managed-shooters/${selectedShooter.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: managedEdit.name.trim(),
          shooterCode: managedEdit.shooterCode.trim().toUpperCase(),
          primaryWeapon: managedEdit.primaryWeapon?.trim() || '',
        }),
      });

      setShooters((prev) => prev.map((shooter) => (shooter.id === updated.id ? updated : shooter)));
      setSelectedShooter(updated);
      setManagedMsg('Managed shooter profile updated.');
    } catch (e) {
      setManagedMsg(e instanceof Error ? e.message : 'Failed to update managed profile');
    } finally {
      setSavingManaged(false);
    }
  }

  async function handleCreateSessionForSelectedShooter() {
    if (!selectedShooter) return;
    if (!selectedShooter.shooterProfile?.isManaged) {
      setSessionMsg('Session creation from coach account is available for managed profiles only.');
      return;
    }

    setSessionBusy(true);
    setSessionMsg(null);
    try {
      const created = await apiFetch<Session>(`/coach/shooters/${selectedShooter.id}/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          discipline: sessionForm.discipline,
          distance: Number(sessionForm.distance),
          weaponType: sessionForm.weaponType || selectedShooter.shooterProfile.primaryWeapon || '10m Air Rifle',
          numberOfShots: Number(sessionForm.numberOfShots),
          sessionDate: new Date(sessionForm.sessionDate).toISOString(),
          trainingMode: sessionForm.trainingMode || undefined,
        }),
      });

      const parsedShots = parseQuickScores(quickScores);
      if (parsedShots.length > 0) {
        await apiFetch(`/coach/shooters/${selectedShooter.id}/sessions/${created.id}/shots`, {
          method: 'POST',
          body: JSON.stringify({ shots: parsedShots }),
        });
      }

      setQuickScores('');
      setSessionMsg(`Session ${formatSessionStart(created.sessionDate)} created.`);
      await selectShooter(selectedShooter);
      loadData();
    } catch (e) {
      setSessionMsg(e instanceof Error ? e.message : 'Failed to create session');
    } finally {
      setSessionBusy(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!selectedShooter || !selectedShooter.shooterProfile?.isManaged) return;

    try {
      await apiFetch(`/coach/shooters/${selectedShooter.id}/sessions/${sessionId}`, { method: 'DELETE' });
      setSessionMsg('Session removed.');
      await selectShooter(selectedShooter);
    } catch (e) {
      setSessionMsg(e instanceof Error ? e.message : 'Failed to remove session');
    }
  }

  async function selectShooter(shooter: User) {
    setSelectedShooter(shooter);
    setLoadingSessions(true);
    setSessions([]);
    setPerformance(null);
    setManagedMsg(null);
    setSessionMsg(null);
    setManagedEdit({
      name: shooter.name,
      shooterCode: shooter.shooterProfile?.shooterCode ?? '',
      primaryWeapon: shooter.shooterProfile?.primaryWeapon ?? '',
    });
    setSessionForm((prev) => ({
      ...prev,
      weaponType: shooter.shooterProfile?.primaryWeapon ?? prev.weaponType,
    }));
    try {
      const [data, summary] = await Promise.all([
        apiFetch<Session[]>(`/coach/shooters/${shooter.id}/sessions`),
        apiFetch<CoachShooterPerformanceSummary>(`/coach/shooters/${shooter.id}/performance`),
      ]);
      setSessions(data);
      setPerformance(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell title="My Shooters">
      <div className="space-y-6">

        {error && (
          <div role="alert"
            className="px-4 py-3 bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)]
                       rounded-lg text-[#FF4D6D] text-sm animate-slide-down">
            {error}
          </div>
        )}

        {/* ── 1. Incoming shooter requests ──────────────────────────────── */}
        {(loadingReqs || requests.length > 0) && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <p className="label">Incoming Requests</p>
              {newRequest && requests.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                                 bg-accent text-[#080A0F] text-[10px] font-display font-bold animate-pulse">
                  {requests.length}
                </span>
              )}
            </div>

            {loadingReqs ? (
              <div className="space-y-2">
                <SkeletonCard height={56} animationDelay={0} />
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <div key={req.id}
                    className="card flex items-center gap-4 px-4 py-3 animate-slide-up
                               border-l-2 border-accent">
                    <div className="w-9 h-9 rounded-full bg-[rgba(245,166,35,0.1)] border border-accent/30
                                    flex items-center justify-center shrink-0">
                      <span className="text-accent font-display font-bold text-sm">
                        {req.shooter?.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F0F4FF] font-semibold text-sm truncate">{req.shooter?.name}</p>
                      <p className="text-[#4A5568] text-[11px] truncate">{req.shooter?.email}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => void handleApprove(req.id)}
                        className="btn btn-primary text-xs py-1.5 px-3"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => void handleReject(req.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#1E2433]
                                   text-[#8892A4] hover:text-[#FF4D6D] hover:border-[#FF4D6D]/40
                                   transition-colors font-display uppercase tracking-wide"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 2. Find & invite a shooter ────────────────────────────────── */}
        <div className="card animate-slide-up">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4
                       hover:bg-[rgba(245,166,35,0.02)] transition-colors"
            aria-expanded={panelOpen}
          >
            <div className="flex items-center gap-2">
              <span className="text-accent font-display font-bold text-sm uppercase tracking-wide">
                + Invite a Shooter
              </span>
              <span className="text-[#4A5568] text-xs font-display">by email address</span>
            </div>
            <span className={`text-[#4A5568] transition-transform duration-300 ${panelOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {panelOpen && (
            <div className="border-t border-[#1E2433] px-5 py-5 space-y-4 animate-slide-down">

              {/* Search row */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setFoundShooter('not-found'); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
                  placeholder="shooter@email.com"
                  className="field flex-1 text-sm"
                  aria-label="Shooter email address"
                />
                <button
                  onClick={() => void handleSearch()}
                  disabled={searching || !inviteEmail.trim()}
                  className="btn btn-ghost text-xs py-2 px-4 disabled:opacity-40 shrink-0"
                >
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </div>

              {/* Search result */}
              {foundShooter !== 'not-found' && (
                foundShooter === null ? (
                  <div className="px-4 py-3 rounded-lg border border-[#1E2433] text-[#4A5568] text-sm">
                    No shooter found with that email address.
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-4 py-3 rounded-lg
                                  bg-[rgba(245,166,35,0.04)] border border-accent/20">
                    <div className="w-9 h-9 rounded-full bg-[rgba(245,166,35,0.1)] border border-accent/30
                                    flex items-center justify-center shrink-0">
                      <span className="text-accent font-display font-bold text-sm">
                        {foundShooter.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F0F4FF] font-semibold text-sm">{foundShooter.name}</p>
                      <p className="text-[#4A5568] text-[11px]">{foundShooter.email}</p>
                    </div>
                    <button
                      onClick={() => void handleInvite(foundShooter.id)}
                      disabled={inviteSending}
                      className="btn btn-primary text-xs py-1.5 px-4 shrink-0"
                    >
                      {inviteSending ? 'Sending…' : 'Send Invite'}
                    </button>
                  </div>
                )
              )}

              {inviteSuccess && (
                <div className="px-4 py-2 rounded-lg bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.25)] text-[#00E5A0] text-sm">
                  {inviteSuccess}
                </div>
              )}
              {inviteError && (
                <div className="px-4 py-2 rounded-lg bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.25)] text-[#FF4D6D] text-sm">
                  {inviteError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. Create managed shooter profile ─────────────────────────── */}
        <div className="card animate-slide-up">
          <div className="px-5 py-4 border-b border-[#1E2433]">
            <h3 className="text-accent font-display font-bold text-sm uppercase tracking-wide">
              Create Managed Shooter Profile
            </h3>
            <p className="text-[#4A5568] text-xs mt-1">
              For students without their own account/device. You can manage their sessions and data from this coach account.
            </p>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={managedCreate.name}
              onChange={(e) => setManagedCreate((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Shooter name"
              className="field text-sm"
            />
            <input
              type="text"
              value={managedCreate.shooterCode}
              onChange={(e) => setManagedCreate((prev) => ({ ...prev, shooterCode: e.target.value }))}
              placeholder="Shooter ID"
              className="field text-sm uppercase"
            />
            <input
              type="text"
              value={managedCreate.primaryWeapon ?? ''}
              onChange={(e) => setManagedCreate((prev) => ({ ...prev, primaryWeapon: e.target.value }))}
              placeholder="Primary weapon (optional)"
              className="field text-sm"
            />
          </div>
          <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void handleCreateManagedProfile()}
              disabled={creatingManaged || !managedCreate.name.trim() || !managedCreate.shooterCode.trim()}
              className="btn btn-primary text-xs py-2 px-4 disabled:opacity-40"
            >
              {creatingManaged ? 'Creating…' : 'Create Profile'}
            </button>
            {managedMsg && (
              <span className={`text-xs ${managedMsg.includes('Failed') || managedMsg.includes('already') ? 'text-[#FF4D6D]' : 'text-[#00E5A0]'}`}>
                {managedMsg}
              </span>
            )}
          </div>
        </div>

        {/* ── 4. Sent invitations (outgoing coach-initiated) ─────────────── */}
        {outgoing.length > 0 && (
          <div className="animate-slide-up">
            <p className="label mb-3">Sent Invitations ({outgoing.length})</p>
            <div className="card overflow-hidden">
              {outgoing.map((inv, i) => (
                <div
                  key={inv.id}
                  className={`flex items-center gap-4 px-5 py-3
                              ${i < outgoing.length - 1 ? 'border-b border-[#1E2433]/60' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[rgba(245,166,35,0.08)] border border-[#1E2433]
                                  flex items-center justify-center shrink-0">
                    <span className="text-[#8892A4] font-display font-bold text-xs">
                      {inv.shooter?.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F0F4FF] text-sm font-medium truncate">{inv.shooter?.name}</p>
                    <p className="text-[#4A5568] text-[11px] truncate">{inv.shooter?.email}</p>
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-display
                                   font-bold uppercase tracking-widest border shrink-0
                                   ${INVITE_STYLE[inv.status as InviteStatus]}`}>
                    {inv.status === 'PENDING' ? 'Awaiting response' : 'Declined'}
                  </span>
                  {inv.status === 'PENDING' && (
                    <button
                      onClick={() => void handleCancelInvite(inv.id)}
                      className="text-[10px] text-[#4A5568] hover:text-[#FF4D6D] font-display
                                 uppercase tracking-wide transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. Connected shooters grid ────────────────────────────────── */}
        <div className="animate-slide-up">
          <p className="label mb-3">Connected Shooters ({shooters.length})</p>

          {loadingShooters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} height={80} animationDelay={i * 60} />
              ))}
            </div>
          ) : shooters.length === 0 ? (
            <EmptyShootersState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {shooters.map((shooter, i) => (
                <ShooterCard
                  key={shooter.id}
                  shooter={shooter}
                  selected={selectedShooter?.id === shooter.id}
                  onSelect={() => void selectShooter(shooter)}
                  delay={i * 60}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 6. Session viewer ─────────────────────────────────────────── */}
        {selectedShooter && (
          <div className="card animate-slide-up">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-[#1E2433]">
              <div>
                <h2 className="font-display font-bold text-lg text-[#F0F4FF]">
                  {selectedShooter.name}
                </h2>
                <p className="text-[#4A5568] text-xs mt-0.5">
                  {selectedShooter.shooterProfile?.isManaged
                    ? `ID: ${selectedShooter.shooterProfile.shooterCode}`
                    : selectedShooter.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedShooter.shooterProfile?.isManaged && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#00E5A0]/30 bg-[#00E5A0]/10 text-[#00E5A0] font-display uppercase tracking-widest">
                    Managed
                  </span>
                )}
                <StatusBadge variant="shooter" size="sm" />
              </div>
            </div>

            {selectedShooter.shooterProfile?.isManaged && (
              <div className="px-5 py-4 border-b border-[#1E2433] space-y-4 bg-[rgba(0,229,160,0.03)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-[#1E2433] bg-[#101522] p-3">
                    <p className="label">Total Sessions</p>
                    <p className="score-value text-xl text-[#F0F4FF] mt-1">{performance?.totalSessions ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-[#1E2433] bg-[#101522] p-3">
                    <p className="label">Average Score</p>
                    <p className="score-value text-xl text-[#00E5A0] mt-1">{(performance?.averageScore ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-[#1E2433] bg-[#101522] p-3">
                    <p className="label">Best Score</p>
                    <p className="score-value text-xl text-accent mt-1">{(performance?.bestScore ?? 0).toFixed(1)}</p>
                  </div>
                </div>

                <div>
                  <p className="label mb-2">Managed Profile Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={managedEdit.name ?? ''}
                      onChange={(e) => setManagedEdit((prev) => ({ ...prev, name: e.target.value }))}
                      className="field text-sm"
                      placeholder="Shooter name"
                    />
                    <input
                      type="text"
                      value={managedEdit.shooterCode ?? ''}
                      onChange={(e) => setManagedEdit((prev) => ({ ...prev, shooterCode: e.target.value }))}
                      className="field text-sm uppercase"
                      placeholder="Shooter ID"
                    />
                    <input
                      type="text"
                      value={managedEdit.primaryWeapon ?? ''}
                      onChange={(e) => setManagedEdit((prev) => ({ ...prev, primaryWeapon: e.target.value }))}
                      className="field text-sm"
                      placeholder="Primary weapon"
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => void handleSaveManagedProfile()}
                      disabled={savingManaged}
                      className="btn btn-ghost text-xs py-2 px-4"
                    >
                      {savingManaged ? 'Saving…' : 'Save Managed Profile'}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="label mb-2">Add Session + Training Data</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={sessionForm.discipline}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, discipline: e.target.value }))}
                      className="field text-sm"
                      placeholder="Discipline"
                    />
                    <input
                      type="text"
                      value={sessionForm.weaponType}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, weaponType: e.target.value }))}
                      className="field text-sm"
                      placeholder="Weapon type"
                    />
                    <input
                      type="number"
                      min={1}
                      value={sessionForm.distance}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, distance: Number(e.target.value) || 10 }))}
                      className="field text-sm"
                      placeholder="Distance"
                    />
                    <input
                      type="number"
                      min={1}
                      value={sessionForm.numberOfShots}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, numberOfShots: Number(e.target.value) || 10 }))}
                      className="field text-sm"
                      placeholder="Number of shots"
                    />
                    <input
                      type="datetime-local"
                      value={sessionForm.sessionDate}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionDate: e.target.value }))}
                      className="field text-sm"
                    />
                    <input
                      type="text"
                      value={sessionForm.trainingMode}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, trainingMode: e.target.value }))}
                      className="field text-sm"
                      placeholder="Training mode (optional)"
                    />
                  </div>
                  <textarea
                    value={quickScores}
                    onChange={(e) => setQuickScores(e.target.value)}
                    placeholder="Quick scores (optional): 10.2, 9.8, 10.5 ..."
                    className="field w-full mt-2 min-h-[72px] text-sm"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => void handleCreateSessionForSelectedShooter()}
                      disabled={sessionBusy}
                      className="btn btn-primary text-xs py-2 px-4"
                    >
                      {sessionBusy ? 'Saving…' : 'Create Session'}
                    </button>
                    {sessionMsg && (
                      <span className={`text-xs ${sessionMsg.includes('Failed') ? 'text-[#FF4D6D]' : 'text-[#4FC3F7]'}`}>
                        {sessionMsg}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {loadingSessions ? (
              <div className="p-5 space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} animationDelay={i * 40} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <p className="text-[#F0F4FF] font-display font-semibold">No sessions yet</p>
                <p className="text-[#4A5568] text-sm mt-1">This shooter hasn't recorded any sessions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-[#1E2433]">
                    <th className="text-left py-3 px-5 label">Session Start</th>
                    <th className="text-left py-3 px-5 label hidden sm:table-cell">Discipline</th>
                    <th className="text-right py-3 px-5 label">Shots</th>
                    <th className="py-3 px-5 text-right label">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      delay={i * 30}
                      canDelete={Boolean(selectedShooter.shooterProfile?.isManaged)}
                      onDelete={() => void handleDeleteSession(s.id)}
                    />
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {!selectedShooter && !loadingShooters && shooters.length > 0 && (
          <div className="text-center py-8 text-[#4A5568] text-sm animate-fade-in">
            Select a shooter above to view their sessions and add feedback.
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── Shooter Card ──────────────────────────────────────────────────────────────

function ShooterCard({
  shooter, selected, onSelect, delay,
}: { shooter: User; selected: boolean; onSelect: () => void; delay: number }) {
  const tier = 'default' as Tier;
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`card p-4 text-left w-full cursor-pointer
                  hover:-translate-y-1 hover:shadow-card-hover
                  transition-all duration-300 ease-spring animate-slide-up
                  ${selected ? 'border-accent/40 bg-accent/5 shadow-glow-sm' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full border-2 ${TIER_RING[tier]}
                          flex items-center justify-center shrink-0
                          bg-[rgba(245,166,35,0.1)] transition-all duration-300`}>
          <span className="text-accent font-display font-bold">{shooter.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[#F0F4FF] font-semibold text-sm truncate">{shooter.name}</p>
            {shooter.shooterProfile?.isManaged && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#00E5A0]/30 bg-[#00E5A0]/10 text-[#00E5A0] font-display uppercase tracking-widest">
                Managed
              </span>
            )}
            {TIER_LABEL[tier] && (
              <span className="text-[9px] font-display font-bold uppercase tracking-widest text-accent shrink-0">
                {TIER_LABEL[tier]}
              </span>
            )}
          </div>
          <p className="text-[#4A5568] text-[10px] truncate">
            {shooter.shooterProfile?.isManaged
              ? `ID ${shooter.shooterProfile.shooterCode}${shooter.shooterProfile.primaryWeapon ? ` · ${shooter.shooterProfile.primaryWeapon}` : ''}`
              : shooter.email}
          </p>
        </div>
        {selected && <span className="text-accent text-sm shrink-0">›</span>}
      </div>
    </button>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  delay,
  canDelete,
  onDelete,
}: {
  session: Session;
  delay: number;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [text, setText]                 = useState('');
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);

  async function submitFeedback() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await apiFetch('/coach/feedback', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id, feedback: text }),
      });
      setSent(true);
      setText('');
      setFeedbackOpen(false);
    } catch {
      // inline UX — silent fail
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <tr
        className="table-row-hover border-b border-[#1E2433]/50 animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <td className="py-3 px-5">
          <span className="score-value text-xs text-[#8892A4]">
            {formatSessionStart(session.sessionDate, { includeYear: true })}
          </span>
        </td>
        <td className="py-3 px-5 hidden sm:table-cell">
          <StatusBadge variant="discipline" label={session.discipline} size="sm" />
        </td>
        <td className="py-3 px-5 text-right score-value text-[#F0F4FF] text-sm">
          {session.numberOfShots}
        </td>
        <td className="py-3 px-5 text-right">
          <div className="flex items-center justify-end gap-3">
            {canDelete && (
              <button
                onClick={onDelete}
                className="text-[10px] text-[#FF4D6D] hover:text-[#ff7f95] font-display uppercase tracking-wide transition-colors"
              >
                Delete
              </button>
            )}
            {sent ? (
              <span className="text-xs text-[#00E5A0] font-display uppercase tracking-wide">Sent ✓</span>
            ) : (
              <button
                onClick={() => setFeedbackOpen((v) => !v)}
                className="text-xs text-accent hover:text-amber-300 font-display uppercase tracking-widest transition-colors"
              >
                {feedbackOpen ? 'Cancel' : 'Feedback'}
              </button>
            )}
          </div>
        </td>
      </tr>

      {feedbackOpen && (
        <tr className="border-b border-[#1E2433]/50 bg-[rgba(79,195,247,0.03)]">
          <td colSpan={4} className="px-5 py-3">
            <div className="flex gap-2 items-start animate-slide-down">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Write coaching feedback for this session..."
                className="field flex-1 resize-none text-sm py-2"
                aria-label="Coaching feedback"
              />
              <button
                onClick={() => void submitFeedback()}
                disabled={sending || !text.trim()}
                className="btn btn-primary text-xs py-2 px-4 shrink-0"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyShootersState() {
  return (
    <div className="card p-12 flex flex-col items-center text-center animate-fade-in">
      <svg width="56" height="56" viewBox="0 0 56 56" className="mb-4 opacity-25" aria-hidden="true">
        <circle cx="20" cy="20" r="14" stroke="#F5A623" strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="20" r="6"  stroke="#F5A623" strokeWidth="1.5" fill="none" />
        <circle cx="36" cy="36" r="14" stroke="#4FC3F7" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      </svg>
      <p className="text-[#F0F4FF] font-display font-bold text-xl">No connected shooters</p>
      <p className="text-[#4A5568] text-sm mt-2 max-w-xs">
        Approve a request, invite by email, or create a managed shooter profile above.
      </p>
    </div>
  );
}
