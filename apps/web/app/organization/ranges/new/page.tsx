'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

export default function AddRangeLocationPage() {
  const router = useRouter();
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Fetch user's org
  useEffect(() => {
    async function init() {
      try {
        const orgs = await apiFetch<any[]>('/organizations');
        if (orgs.length > 0) {
          setOrganizationId(orgs[0].id);
        } else {
          router.replace('/onboarding');
        }
      } catch (err) {
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Location Name is required');
    if (!organizationId) return setError('Organization not found');

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch(`/organizations/${organizationId}/ranges`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          address,
          phone,
        })
      });
      router.push('/organization/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register new location');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in text-white">
      <div className="mb-6">
        <Link href="/organization/dashboard" className="text-text-muted hover:text-white transition-colors text-sm mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Register New Location</h1>
        <p className="text-text-muted">Add a new physical shooting range location to your business.</p>
      </div>

      <div className="bg-elevated border border-border-subtle rounded-xl p-8 shadow-xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Location Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Downtown"
              className="w-full bg-[#1A2030] border border-[#2A3040] text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#00E5A0] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Physical Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="123 Main St..."
              className="w-full bg-[#1A2030] border border-[#2A3040] text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#00E5A0] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full bg-[#1A2030] border border-[#2A3040] text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#00E5A0] transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <Link 
              href="/organization/dashboard"
              className="px-6 py-2.5 text-text-muted hover:text-white transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
