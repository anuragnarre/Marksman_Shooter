// apps/web/app/settings/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { DeviceManager } from '../../components/DeviceManager';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { apiFetch } from '../../lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // ── Profile ───────────────────────────────────────────────────────────────
  const [name, setName]                   = useState('');
  const [bio, setBio]                     = useState('');
  const [location, setLocation]           = useState('');
  const [dob, setDob]                     = useState('');
  const [profileMsg, setProfileMsg]       = useState<string | null>(null);
  const [profileErr, setProfileErr]       = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
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
        { method: 'PUT', body: JSON.stringify({ name }) },
      );
      setUser({ ...user!, name: updated.name });
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileErr(msg);
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
    SHOOTER: 'bg-[rgba(79,195,247,0.12)] text-[#4FC3F7] border-[rgba(79,195,247,0.25)]',
    COACH:   'bg-[rgba(245,166,35,0.12)] text-[#F5A623] border-[rgba(245,166,35,0.25)]',
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        <section className="card p-6 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <h2 className="font-display font-bold text-xl text-text-primary mb-1">Profile</h2>
          <p className="text-text-secondary text-sm mb-5">Update your display name.</p>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label htmlFor="settings-name" className="label">Display name</label>
              <input
                id="settings-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
                placeholder="Arjun Sharma"
              />
            </div>

            <div>
              <label htmlFor="settings-bio" className="label">Bio (Optional)</label>
              <textarea
                id="settings-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="field min-h-[80px]"
                placeholder="Tell us a bit about your shooting journey"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-location" className="label">Location (Optional)</label>
                <input
                  id="settings-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="field"
                  placeholder="e.g. London, UK"
                />
              </div>
              <div>
                <label htmlFor="settings-dob" className="label">Date of Birth (Optional)</label>
                <input
                  id="settings-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="field"
                />
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
              {profileLoading ? <SpinnerLabel text="Saving..." /> : 'Save changes'}
            </button>
          </form>
        </section>

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <section className="card p-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="font-display font-bold text-xl text-text-primary mb-1">Account</h2>
          <p className="text-text-secondary text-sm mb-5">Your account details.</p>

          <div className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                readOnly
                value={user?.email ?? ''}
                className="field opacity-60 cursor-not-allowed"
                tabIndex={-1}
              />
            </div>

            <div>
              <label className="label">Role</label>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-1 text-xs font-display font-semibold uppercase
                              tracking-wider rounded-full border
                              ${roleBadgeColor[user?.role ?? 'SHOOTER'] ?? roleBadgeColor.SHOOTER}`}
                >
                  {user?.role ?? 'SHOOTER'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <section className="card p-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <h2 className="font-display font-bold text-xl text-text-primary mb-1">Appearance</h2>
          <p className="text-text-secondary text-sm mb-5">Choose your preferred theme.</p>

          <div className="flex gap-3">
            {([
              { value: 'dark' as const, label: 'Dark', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )},
              { value: 'light' as const, label: 'Light', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )},
              { value: 'system' as const, label: 'System', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )},
            ]).map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border
                            font-display font-semibold text-sm uppercase tracking-wider
                            transition-all duration-200 ${
                              theme === value
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-border-subtle bg-transparent text-text-secondary hover:border-accent/30 hover:bg-accent/5'
                            }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Change Password ──────────────────────────────────────────────── */}
        <section className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-between items-start sm:items-center mb-1 flex-col sm:flex-row gap-2">
            <h2 className="font-display font-bold text-xl text-text-primary">Change Password</h2>
            <button 
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-accent text-sm font-display uppercase tracking-widest font-semibold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--accent-primary)' }}
            >
              {showPasswordForm ? 'Hide Form' : 'Change Password'}
            </button>
          </div>
          <p className="text-text-secondary text-sm mb-5">
            Use a strong password with at least 8 characters.
          </p>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4 border-t border-border-subtle pt-5 mt-5">
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

        {/* ── Devices ─────────────────────────────────────────────────────── */}
        <section className="card p-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="font-display font-bold text-xl text-text-primary mb-1">Devices</h2>
          <p className="text-text-secondary text-sm mb-5">
            Connect biometric sensors and health devices to track heart rate and SpO2 during sessions.
          </p>
          <DeviceManager />
        </section>

        {/* ── Danger Zone ──────────────────────────────────────────────────── */}
        <section
          className="card p-6 border-[rgba(255,77,109,0.25)] animate-slide-up"
          style={{ animationDelay: '320ms' }}
        >
          <h2 className="font-display font-bold text-xl text-[#FF4D6D] mb-1">Danger Zone</h2>
          <p className="text-text-secondary text-sm mb-5">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {deleteConfirm && (
            <div className="mb-4 px-4 py-3 bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.3)]
                            rounded-lg text-[#FF4D6D] text-sm">
              Are you sure? Click the button again to confirm permanent deletion.
            </div>
          )}

          {deleteErr && <InlineError message={deleteErr} />}

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="btn btn-danger"
            aria-busy={deleteLoading}
          >
            {deleteLoading ? (
              <SpinnerLabel text="Deleting..." />
            ) : deleteConfirm ? (
              'Confirm delete account'
            ) : (
              'Delete account'
            )}
          </button>
        </section>

      </div>
    </AppShell>
  );
}

// ── Inline feedback components ────────────────────────────────────────────────

function InlineSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 px-4 py-3 bg-[rgba(0,229,160,0.08)]
                 border border-[rgba(0,229,160,0.3)] rounded-lg text-[#00E5A0] text-sm"
    >
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"
      >
        <path d="M3.5 7.5L6 10L10.5 4.5" />
      </svg>
      {message}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 px-4 py-3 bg-[rgba(255,77,109,0.08)]
                 border border-[rgba(255,77,109,0.3)] rounded-lg text-[#FF4D6D] text-sm"
    >
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"
      >
        <path d="M7 1L13 12H1z" />
        <line x1="7" y1="5.5" x2="7" y2="8" />
        <circle cx="7" cy="10" r="0.7" fill="currentColor" stroke="none" />
      </svg>
      {message}
    </div>
  );
}

function SpinnerLabel({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="w-4 h-4 border-2 border-[#F5A623]/30 border-t-[#F5A623] rounded-full animate-spin"
        aria-hidden="true"
      />
      {text}
    </span>
  );
}
