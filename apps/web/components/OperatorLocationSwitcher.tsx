'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/auth-context';

export function OperatorLocationSwitcher() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRangeId = searchParams?.get('rangeId');
  
  const [ranges, setRanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'RANGE_OPERATOR') {
      setLoading(false);
      return;
    }
    
    async function fetchOrg() {
      try {
        const orgs = await apiFetch<any[]>('/organizations');
        if (orgs.length > 0 && orgs[0].ranges) {
          setRanges(orgs[0].ranges);
        }
      } catch (err) {
        console.error('Failed to load ranges for switcher', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [user]);

  if (user?.role !== 'RANGE_OPERATOR') return null;
  if (loading) return <div className="h-9 w-32 skeleton rounded-xl ml-2" />;
  if (ranges.length === 0) return null;

  return (
    <div className="ml-2 hidden sm:block">
      <select
        value={currentRangeId || 'org'}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'org') {
            router.push('/operator/organization/dashboard');
          } else {
            router.push(`/operator/dashboard?rangeId=${val}`);
          }
        }}
        className="h-9 bg-[#1A2030] border border-[#2A3040] text-white text-sm rounded-xl px-3 outline-none focus:border-[#00E5A0] transition-colors appearance-none cursor-pointer"
        style={{ paddingRight: '28px' }} // Space for a custom dropdown arrow if needed
      >
        <option value="org">Brand Dashboard</option>
        {ranges.map((r) => (
          <option key={r.id} value={r.id}>
            📍 {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
