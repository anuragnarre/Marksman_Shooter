'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../contexts/auth-context';

export default function OrganizationDashboardPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const orgs = await apiFetch<any[]>('/organizations');
        setOrganizations(orgs);
      } catch (err) {
        console.error('Failed to load organizations', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-white">Loading dashboard...</div>;

  const mainOrg = organizations[0]; // For now, assume 1 brand per operator

  if (!mainOrg) {
    return (
      <div className="p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">No Business Found</h2>
        <Link href="/onboarding" className="text-accent hover:underline">
          Go to Onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in text-white">
      <header className="flex justify-between items-end border-b border-[#1E2433] pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">{mainOrg.name}</h1>
          <p className="text-text-muted">Brand Dashboard &bull; {mainOrg.type}</p>
        </div>
        <Link 
          href="/organization/ranges/new"
          className="bg-accent text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
        >
          + Add Location
        </Link>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-4">Locations ({mainOrg.ranges?.length || 0})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainOrg.ranges?.map((range: any) => (
            <div key={range.id} className="bg-elevated border border-border-subtle rounded-xl p-6 flex flex-col hover:border-accent transition-colors">
              <h3 className="text-lg font-bold text-white mb-1">{range.name}</h3>
              <p className="text-sm text-text-muted mb-4">{range.address || 'No address provided'}</p>
              
              <div className="flex justify-between items-center text-sm mb-6">
                <span className="bg-[#1A2030] px-3 py-1 rounded-full text-gray-300">
                  {range.rangeStatus || 'ACTIVE'}
                </span>
                <span className="text-accent">{range.code}</span>
              </div>

              <div className="mt-auto flex gap-3">
                {/* Link to standard operator dashboard for this specific location */}
                <Link href={`/operator/dashboard?rangeId=${range.id}`} className="flex-1 bg-surface border border-border-subtle text-center py-2 rounded-lg text-sm font-semibold hover:bg-[#2A3040] transition-colors">
                  Manage
                </Link>
                <Link href={`/operator/staff?rangeId=${range.id}`} className="flex-1 bg-surface border border-border-subtle text-center py-2 rounded-lg text-sm font-semibold hover:bg-[#2A3040] transition-colors">
                  Staff
                </Link>
              </div>
            </div>
          ))}
          
          {(!mainOrg.ranges || mainOrg.ranges.length === 0) && (
            <div className="col-span-full p-8 border border-dashed border-border-subtle rounded-xl text-center text-text-muted">
              You haven't registered any locations yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
