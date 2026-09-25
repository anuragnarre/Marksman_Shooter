'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { apiFetch } from '../../lib/api';

export default function OperatorOnboardingPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('COMMERCIAL');
  
  const [rangeName, setRangeName] = useState('');
  const [rangeAddress, setRangeAddress] = useState('');
  
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoading, isLoggedIn, router]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return setError('Business name is required.');
    
    setLoading(true);
    setError(null);
    try {
      const org = await apiFetch<any>('/organizations', { 
        method: 'POST', 
        body: JSON.stringify({ name: orgName, type: orgType })
      });
      // Save org ID to context/local storage if needed, then move to step 2
      localStorage.setItem('onboardingOrgId', org.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeName.trim()) return setError('Location name is required.');
    
    setLoading(true);
    setError(null);
    try {
      const orgId = localStorage.getItem('onboardingOrgId');
      if (!orgId) throw new Error('Organization ID missing');
      
      await apiFetch(`/organizations/${orgId}/ranges`, {
        method: 'POST',
        body: JSON.stringify({
          name: rangeName,
          address: rangeAddress
        })
      });
      
      // Cleanup and redirect to dashboard
      localStorage.removeItem('onboardingOrgId');
      router.push('/dashboard'); // or /operator/organization/dashboard
    } catch (err: any) {
      setError(err.message || 'Failed to register range location');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isLoggedIn) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0F1420] border border-[#1E2433] rounded-2xl p-8 shadow-2xl">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 1 ? 'Setup your Business' : 'Add First Location'}
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 1 
              ? 'Create your top-level brand or organization account.' 
              : 'Register your first physical shooting range location.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleCreateOrganization} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Business / Brand Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Shooting Academy"
                className="w-full bg-[#1A2030] border border-[#2A3040] text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#00E5A0] transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Type</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full bg-[#1A2030] border border-[#2A3040] text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#00E5A0] transition-colors appearance-none"
              >
                <option value="COMMERCIAL">Commercial Range</option>
                <option value="CLUB">Members Club</option>
                <option value="ACADEMY">Training Academy</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00E5A0] text-black font-semibold rounded-lg px-4 py-3 hover:bg-[#00c287] transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateRange} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Location Name</label>
              <input
                type="text"
                value={rangeName}
                onChange={(e) => setRangeName(e.target.value)}
                placeholder="e.g. Acme North"
                className="w-full bg-[#1A2030] border border-[#2A3040] text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#00E5A0] transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Address</label>
              <input
                type="text"
                value={rangeAddress}
                onChange={(e) => setRangeAddress(e.target.value)}
                placeholder="123 Main St..."
                className="w-full bg-[#1A2030] border border-[#2A3040] text-white rounded-lg px-4 py-2.5 outline-none focus:border-[#00E5A0] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00E5A0] text-black font-semibold rounded-lg px-4 py-3 hover:bg-[#00c287] transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Complete Setup'}
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}
