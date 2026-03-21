// apps/web/app/settings/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../contexts/auth-context';
import { apiFetch } from '../../lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();

  // ── Profile ───────────────────────────────────────────────────────────────
  const [name, setName]                   = useState('');
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
    setProfileLoading(true);

    try {
      // TODO: Create PUT /auth/profile endpoint on the API if it doesn't exist yet
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
      // TODO: Create PUT /auth/password endpoint on the API if it doesn't exist yet
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
      // TODO: Create DELETE /auth/account endpoint on the API if it doesn't exist yet
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
    SOLDIER: 'bg-[rgba(0,229,160,0.12)] text-[#00E5A0] border-[rgba(0,229,160,0.25)]',
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        <section className="card p-6 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <h2 className="font-display font-bold text-xl text-[#F0F4FF] mb-1">Profile</h2>
          <p className="text-[#8892A4] text-sm mb-5">Update your display name.</p>

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
                placeholder="Your name"
              />
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
          <h2 className="font-display font-bold text-xl text-[#F0F4FF] mb-1">Account</h2>
          <p className="text-[#8892A4] text-sm mb-5">Your account details.</p>

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

        {/* ── Change Password ──────────────────────────────────────────────── */}
        <section className="card p-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="font-display font-bold text-xl text-[#F0F4FF] mb-1">Change Password</h2>
          <p className="text-[#8892A4] text-sm mb-5">
            Use a strong password with at least 8 characters.
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-4">
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
        </section>

        {/* ── Danger Zone ──────────────────────────────────────────────────── */}
        <section
          className="card p-6 border-[rgba(255,77,109,0.25)] animate-slide-up"
          style={{ animationDelay: '240ms' }}
        >
          <h2 className="font-display font-bold text-xl text-[#FF4D6D] mb-1">Danger Zone</h2>
          <p className="text-[#8892A4] text-sm mb-5">
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
