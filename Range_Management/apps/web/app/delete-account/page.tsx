'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { apiFetch } from '../../lib/api';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/account', { method: 'DELETE' });
      logout();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 sm:p-6 selection:bg-accent/30 font-body">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <Link href="/" className="text-accent hover:underline flex items-center gap-1 font-display uppercase tracking-wider">
            &larr; Return to Marksman
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/privacy-policy" className="hover:text-text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/terms-of-service" className="hover:text-text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Main Content Card */}
        {success ? (
          <div className="card p-8 text-center space-y-4 animate-fade-in border-[#00E5A0]/30 bg-[#00E5A0]/5">
            <div className="w-12 h-12 rounded-full bg-[#00E5A0]/20 text-[#00E5A0] flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h1 className="font-display font-bold text-2xl text-[#00E5A0] uppercase tracking-wide">
              Account Deleted Successfully
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your Marksman account, profile credentials, biometric sensor metrics, shot sessions, and coach associations have been permanently removed from our active databases.
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn btn-primary w-full mt-4"
            >
              Return to Home
            </button>
          </div>
        ) : !isLoggedIn ? (
          <div className="card p-8 text-center space-y-6 animate-fade-in">
            <h1 className="font-display font-bold text-2xl text-text-primary uppercase tracking-wide">
              Account &amp; Data Deletion Request
            </h1>
            <div className="text-left text-xs sm:text-sm text-text-secondary space-y-3 bg-elevated p-4 rounded-lg border border-border-subtle">
              <p>
                In compliance with the <strong>Digital Personal Data Protection Act, 2023</strong>, <strong>GDPR (Article 17)</strong>, <strong>Apple App Store Rule 5.1.1(v)</strong>, and <strong>Google Play Data Safety</strong> guidelines, you have the right to permanent deletion of your account and associated data.
              </p>
              <p className="text-text-muted text-xs">
                To verify your identity and ensure unauthorized parties cannot delete your training logs, please sign in first.
              </p>
            </div>
            <button
              onClick={() => router.push('/auth/login')}
              className="btn btn-primary w-full"
            >
              Sign In to Delete Account
            </button>
          </div>
        ) : (
          <div className="card p-8 border-[rgba(255,77,109,0.3)] bg-elevated space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[rgba(255,77,109,0.15)] text-[#FF4D6D] flex items-center justify-center mx-auto text-xl font-bold">
                ⚠️
              </div>
              <h1 className="font-display font-bold text-2xl text-[#FF4D6D] uppercase tracking-wider">
                Permanent Account Deletion
              </h1>
              <p className="text-text-primary font-semibold text-sm">
                Account: <span className="text-accent">{user?.email}</span>
              </p>
            </div>

            <div className="p-4 bg-[rgba(255,77,109,0.06)] border border-[rgba(255,77,109,0.2)] rounded-lg text-xs sm:text-sm text-text-secondary space-y-2">
              <p className="font-semibold text-text-primary">The following data will be permanently wiped:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-text-muted">
                <li>Shooter profile, credentials, and equipment records</li>
                <li>All historical shooting sessions, target scores, and dispersion maps</li>
                <li>Biometric sensor data (heart rate, breathing patterns, stability metrics)</li>
                <li>Coach feedback, team memberships, and private notes</li>
              </ul>
              <p className="text-[#FF4D6D] font-bold text-xs pt-1">
                This action is permanent and cannot be reversed.
              </p>
            </div>

            {deleteConfirm && (
              <div className="px-4 py-3 bg-[rgba(255,77,109,0.12)] border border-[rgba(255,77,109,0.4)] rounded-lg text-[#FF4D6D] text-sm text-center font-medium animate-shake">
                Are you absolutely sure? Click the button below to confirm permanent deletion.
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-[rgba(255,77,109,0.12)] border border-[rgba(255,77,109,0.4)] rounded-lg text-[#FF4D6D] text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-danger w-full py-3"
              >
                {loading ? 'Processing Deletion...' : deleteConfirm ? 'Yes, Permanently Delete My Account' : 'Request Account Deletion'}
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                disabled={loading}
                className="w-full text-text-muted hover:text-text-primary text-sm transition-colors text-center block py-1"
              >
                Cancel and return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* App Store Policy Note */}
        <div className="text-center text-[11px] text-text-muted space-y-1">
          <p>
            Need help or have compliance inquiries? Contact our Data Protection Officer at{' '}
            <a href="mailto:privacy@marksman.app" className="text-accent hover:underline">
              privacy@marksman.app
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
