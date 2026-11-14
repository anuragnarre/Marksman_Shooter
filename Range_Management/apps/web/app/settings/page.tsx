// apps/web/app/settings/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RangeConsoleSidebar } from '../../components/dashboard/RangeConsoleSidebar';
import { RangeConsoleHeader } from '../../components/dashboard/RangeConsoleHeader';
import { DeviceManager } from '../../components/DeviceManager';
import {
  MaterialIcon,
  IconDashboard,
  IconMyLocation,
  IconBadge,
  IconReport,
  IconMenu,
} from '../../components/ui/TacticalIcons';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { useToast } from '../../contexts/toast-context';
import { apiFetch, ApiError } from '../../lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme, dashboardTheme, setDashboardTheme } = useTheme();
  const { toast } = useToast();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [rangeStatus, setRangeStatus] = useState<'HOT' | 'COLD'>('HOT');

  // ── Profile ───────────────────────────────────────────────────────────────
  const [name, setName]                   = useState('');
  const [bio, setBio]                     = useState('');
  const [location, setLocation]           = useState('Indoor Range Alpha — 25 YDS');
  const [profileMsg, setProfileMsg]       = useState<string | null>(null);
  const [profileErr, setProfileErr]       = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (typeof window !== 'undefined') {
      const savedStation = localStorage.getItem('marksman_station_meta');
      if (savedStation) {
        try {
          const parsed = JSON.parse(savedStation);
          if (parsed.bio) setBio(parsed.bio);
          if (parsed.location) setLocation(parsed.location);
        } catch {}
      }
    }
  }, [user?.name]);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setProfileErr('Name must be at least 2 characters.');
      return;
    }

    setProfileLoading(true);
    try {
      const updated = await apiFetch<{ id: string; name: string; email: string; role: string }>(
        '/auth/profile',
        { method: 'PUT', body: JSON.stringify({ name: trimmedName }) },
      );
      const nextUser = {
        ...(user || { id: 'rso-demo-01', email: 'rso@marksmanspro.com', role: 'RANGE_OPERATOR' as const, createdAt: new Date() }),
        name: updated?.name || trimmedName,
      };
      setUser(nextUser as any);
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_user', JSON.stringify(nextUser));
        localStorage.setItem('marksman_station_meta', JSON.stringify({ bio, location }));
      }
      setProfileMsg('Profile updated successfully.');
      toast('Operator profile saved', 'success');
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        setProfileErr(err.message);
      } else {
        const nextUser = {
          ...(user || { id: 'rso-demo-01', email: 'rso@marksmanspro.com', role: 'RANGE_OPERATOR' as const, createdAt: new Date() }),
          name: trimmedName,
        };
        setUser(nextUser as any);
        if (typeof window !== 'undefined') {
          localStorage.setItem('current_user', JSON.stringify(nextUser));
          localStorage.setItem('marksman_station_meta', JSON.stringify({ bio, location }));
        }
        setProfileMsg('Profile updated in local station cache.');
        toast('Operator profile saved locally', 'success');
      }
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg]                     = useState<string | null>(null);
  const [pwErr, setPwErr]                     = useState<string | null>(null);
  const [pwLoading, setPwLoading]             = useState(false);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);

    if (newPassword !== confirmPassword) {
      setPwErr('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwErr('New password must be at least 8 characters.');
      return;
    }

    setPwLoading(true);
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPwErr(msg);
    } finally {
      setPwLoading(false);
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm]     = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [deleteErr, setDeleteErr]             = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    setDeleteErr(null);
    try {
      await apiFetch('/auth/account', { method: 'DELETE' });
      logout();
      router.push('/auth/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      setDeleteErr(msg);
      setDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Role badge color ─────────────────────────────────────────────────────
  const roleBadgeColor: Record<string, string> = {
    RANGE_OPERATOR: 'bg-primary/10 text-primary border-primary/30',
    RSO:            'bg-secondary/10 text-secondary border-secondary/30',
    SHOOTER:        'bg-tertiary/10 text-tertiary border-tertiary/30',
    COACH:          'bg-accent/10 text-accent border-accent/30',
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans select-none overflow-x-hidden">
      <RangeConsoleSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <RangeConsoleHeader
        rangeStatus={rangeStatus}
        onToggleStatus={() => {
          const next = rangeStatus === 'HOT' ? 'COLD' : 'HOT';
          setRangeStatus(next);
          toast(
            next === 'COLD'
              ? 'RANGE COLD — Cease-Fire Engaged'
              : 'RANGE HOT — Live Fire Cleared',
            next === 'COLD' ? 'warning' : 'success',
          );
        }}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <main className="pl-0 lg:pl-64 pt-[calc(3.5rem+var(--sat))] pb-[calc(5.25rem+var(--sab))] lg:pb-8 min-h-screen bg-surface w-full p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          <div>
            <h1 className="text-2xl font-bold text-on-surface font-headline-md tracking-tight">Range Console Settings</h1>
            <p className="text-xs text-on-surface-variant mt-1">Configure facility operations, layout themes, optics mode, and safety interlocks.</p>
          </div>

          {/* ── Dashboard Interface Theme ───────────────────────────────────── */}
          <section className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="palette" className="text-primary w-[22px] h-[22px]" />
              <h2 className="font-bold text-lg text-on-surface">Dashboard Interface Theme</h2>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">
              Select your primary Range Operations console layout from the Google Stitch project design specifications.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDashboardTheme('compact-tactical')}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 ${
                  dashboardTheme === 'compact-tactical'
                    ? 'border-primary bg-surface-container-high shadow-md ring-2 ring-primary'
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="dashboard" className="text-primary w-5 h-5" />
                    <span className="font-bold text-on-surface text-sm">Compact Desktop Tactical Console</span>
                  </div>
                  {dashboardTheme === 'compact-tactical' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary text-on-primary shrink-0">Active</span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  High-density 12-bay live firing line bento grid with acoustic RT-60 sparklines, direct SCADA override, and quick walk-in kiosk intake.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-outline flex-wrap">
                  <span>• 4 KPI Bento</span>
                  <span>• 12-Bay Matrix</span>
                  <span>• SCADA E-Stop</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDashboardTheme('harmonized-precision')}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 ${
                  dashboardTheme === 'harmonized-precision'
                    ? 'border-primary bg-surface-container-high shadow-md ring-2 ring-primary'
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="grid_view" className="text-primary w-5 h-5" />
                    <span className="font-bold text-on-surface text-sm">Harmonized Precision Facility Console</span>
                  </div>
                  {dashboardTheme === 'harmonized-precision' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary text-on-primary shrink-0">Active</span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Full-facility operations console featuring Bay Alpha/Bravo ribbon, Flow Vector telemetry, M1-M12 motor servos health, and OSHA dosimeter strip.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-outline flex-wrap">
                  <span>• Control Ribbon</span>
                  <span>• HVAC & Servos</span>
                  <span>• OSHA Dosimeter</span>
                </div>
              </button>
            </div>
          </section>

          {/* ── Appearance (Optics Mode) ────────────────────────────────────── */}
          <section className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="contrast" className="text-primary w-[22px] h-[22px]" />
              <h2 className="font-bold text-lg text-on-surface">Optics Mode (Color Theme)</h2>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">
              Switch between Light Mode and Dark Mode. Both Stitch console designs support complete Light and Dark optics.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {([
                { value: 'dark' as const, label: 'Dark Mode (Night Optics)', icon: 'dark_mode' },
                { value: 'light' as const, label: 'Light Mode (High Contrast)', icon: 'light_mode' },
                { value: 'system' as const, label: 'System Default', icon: 'settings_brightness' },
              ]).map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border
                              font-semibold text-xs uppercase tracking-wider
                              transition-all duration-200 ${
                                theme === value
                                  ? 'border-primary bg-surface-container-high text-primary shadow-sm ring-2 ring-primary'
                                  : 'border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant hover:border-outline-variant'
                              }`}
                >
                  <MaterialIcon name={icon} className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Profile & Facility Operator Info ─────────────────────────── */}
          <section className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="badge" className="text-primary w-[22px] h-[22px]" />
              <h2 className="font-bold text-lg text-on-surface">Operator Profile & Credentials</h2>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">Duty station and range safety officer credentials.</p>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label htmlFor="settings-name" className="label">Operator Call Name</label>
                <input
                  id="settings-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field"
                  placeholder="Sgt. Miller (Lead RSO)"
                />
              </div>

              <div>
                <label htmlFor="settings-bio" className="label">Station Notes / Certifications</label>
                <textarea
                  id="settings-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="field min-h-[80px]"
                  placeholder="NRA Certified RSO / Range Master 25yd Indoor Bay"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-location" className="label">Assigned Facility</label>
                  <input
                    id="settings-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="field"
                    placeholder="Range Alpha"
                  />
                </div>
                <div>
                  <label className="label">Role Clearance</label>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border ${
                        roleBadgeColor[user?.role ?? 'RANGE_OPERATOR'] ?? roleBadgeColor.RANGE_OPERATOR
                      }`}
                    >
                      {user?.role ?? 'RANGE_OPERATOR'} (LEAD RSO)
                    </span>
                  </div>
                </div>
              </div>

              {profileMsg && <InlineSuccess message={profileMsg} />}
              {profileErr && <InlineError message={profileErr} />}

              <button
                type="submit"
                disabled={profileLoading}
                className="btn btn-primary"
                aria-busy={profileLoading}
              >
                {profileLoading ? <SpinnerLabel text="Saving..." /> : 'Save Operator Profile'}
              </button>
            </form>
          </section>

          {/* ── Change Password ──────────────────────────────────────────────── */}
          <section className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start sm:items-center mb-1 flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <MaterialIcon name="lock" className="text-primary w-[22px] h-[22px]" />
                <h2 className="font-bold text-lg text-on-surface">Security & Password</h2>
              </div>
              <button 
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-primary text-xs uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
              >
                {showPasswordForm ? 'Hide Form' : 'Change Password'}
              </button>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">
              Update SCADA console operator password (minimum 8 characters).
            </p>

            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="space-y-4 border-t border-outline-variant/15 pt-5 mt-5">
                <div>
                  <label htmlFor="settings-cur-pw" className="label">Current password</label>
                  <input
                    id="settings-cur-pw"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="field"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label htmlFor="settings-new-pw" className="label">New password</label>
                  <input
                    id="settings-new-pw"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="field"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label htmlFor="settings-confirm-pw" className="label">Confirm new password</label>
                  <input
                    id="settings-confirm-pw"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="field"
                    placeholder="Confirm new password"
                  />
                </div>

                {pwMsg && <InlineSuccess message={pwMsg} />}
                {pwErr && <InlineError message={pwErr} />}

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="btn btn-primary"
                  aria-busy={pwLoading}
                >
                  {pwLoading ? <SpinnerLabel text="Updating..." /> : 'Update password'}
                </button>
              </form>
            )}
          </section>

          {/* ── Devices & Range Hardware ─────────────────────────────────── */}
          <section className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="devices" className="text-primary w-[22px] h-[22px]" />
              <h2 className="font-bold text-lg text-on-surface">Target Line Cameras & Pulley Servos</h2>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">
              Configure wireless target camera links, decibel dosimeters, and target carrier calibration.
            </p>
            <DeviceManager />
          </section>

          {/* ── Legal & Policies ────────────────────────────────────────────── */}
          <section className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="policy" className="text-primary w-[22px] h-[22px]" />
              <h2 className="font-bold text-lg text-on-surface">Legal & Safety Compliance</h2>
            </div>
            <p className="text-on-surface-variant text-xs mb-4">
              Review OSHA range ventilation guidelines, federal lead abatement logs, and safety disclaimers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/privacy-policy"
                className="px-4 py-2 rounded-lg border border-outline-variant/20 bg-surface-container hover:border-primary text-xs font-medium text-on-surface transition-colors flex items-center gap-1.5"
              >
                <span>Privacy Policy</span>
                <MaterialIcon name="open_in_new" className="w-3.5 h-3.5 text-outline" />
              </Link>
              <Link
                href="/terms-of-service"
                className="px-4 py-2 rounded-lg border border-outline-variant/20 bg-surface-container hover:border-primary text-xs font-medium text-on-surface transition-colors flex items-center gap-1.5"
              >
                <span>Safety Protocols & Terms</span>
                <MaterialIcon name="open_in_new" className="w-3.5 h-3.5 text-outline" />
              </Link>
            </div>
          </section>

          {/* ── Session & Danger Zone ───────────────────────────────────────── */}
          <section className="bg-surface-container-low border border-error/30 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="warning" className="text-error w-[22px] h-[22px]" />
              <h2 className="font-bold text-lg text-error">Station Session & Danger Zone</h2>
            </div>
            <p className="text-on-surface-variant text-xs mb-5">
              Sign out of the operator terminal or permanently wipe station credentials.
            </p>

            {deleteConfirm && (
              <div className="mb-4 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-xs">
                Are you sure? Click again to confirm permanent decommissioning.
              </div>
            )}

            {deleteErr && <InlineError message={deleteErr} />}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase bg-surface-container-high border border-outline-variant/30 text-on-surface hover:border-primary transition-all"
              >
                Sign Out Terminal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase bg-error text-on-error hover:opacity-90 transition-all"
                aria-busy={deleteLoading}
              >
                {deleteLoading ? (
                  <SpinnerLabel text="Decommissioning..." />
                ) : deleteConfirm ? (
                  'Confirm Decommission'
                ) : (
                  'Decommission Station Account'
                )}
              </button>
            </div>
          </section>

        </div>
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[calc(3.5rem+var(--sab))] pb-[var(--sab)] bg-surface-container-lowest border-t border-outline-variant/30 z-40 flex items-center justify-around lg:hidden select-none px-2 shadow-2xl">
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1">
          <IconDashboard className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">Console</span>
        </Link>
        <Link href="/lanes" className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1">
          <IconMyLocation className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">Lanes</span>
        </Link>
        <Link href="/checkin" className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1">
          <IconBadge className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">Kiosk</span>
        </Link>
        <Link href="/safety" className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1">
          <IconReport className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">Safety</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 text-primary py-1"
        >
          <IconMenu className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </nav>
    </div>
  );
}

// ── Inline feedback components ────────────────────────────────────────────────

function InlineSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500 text-xs font-medium"
    >
      <MaterialIcon name="check_circle" className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-xs font-medium"
    >
      <MaterialIcon name="error" className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
}

function SpinnerLabel({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
        aria-hidden="true"
      />
      {text}
    </span>
  );
}
