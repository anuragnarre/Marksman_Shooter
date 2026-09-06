'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '../../../components/TopBar';
import { apiFetch } from '../../../lib/api';

export default function FastWalkInPage() {
  const router = useRouter();
  const [range, setRange] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [laneId, setLaneId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRange() {
      const myRanges = await apiFetch('/ranges');
      if (myRanges && myRanges.length > 0) {
        const details = await apiFetch(`/ranges/${myRanges[0].id}`);
        setRange(details);
        if (details.lanes && details.lanes.length > 0) {
          setLaneId(details.lanes[0].id);
        }
      }
    }
    loadRange();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!range || !name || !laneId) return;
    setLoading(true);
    try {
      await apiFetch(`/ranges/${range.id}/walk-in`, {
        method: 'POST',
        body: JSON.stringify({ name, email, laneId }),
      });
      router.push('/range-operator/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to register guest');
    } finally {
      setLoading(false);
    }
  }

  if (!range) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-void text-text-primary">
      <TopBar title="Fast Walk-in Registration" backUrl="/range-operator/dashboard" />
      
      <div className="p-4 md:p-8 flex-1 overflow-y-auto max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="panel space-y-6">
          <div>
            <label className="block text-sm text-text-secondary mb-1 uppercase font-display tracking-wider">Shooter Name *</label>
            <input
              type="text"
              required
              className="w-full input-field"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1 uppercase font-display tracking-wider">Email (Optional)</label>
            <input
              type="email"
              className="w-full input-field"
              placeholder="For claiming account later"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-text-muted mt-1">If left blank, a temporary offline ID will be generated.</p>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1 uppercase font-display tracking-wider">Assign Lane *</label>
            <select 
              required
              className="w-full input-field"
              value={laneId}
              onChange={(e) => setLaneId(e.target.value)}
            >
              <option value="">Select a Lane</option>
              {range.lanes?.map((lane: any) => (
                <option key={lane.id} value={lane.id} disabled={lane.status !== 'AVAILABLE'}>
                  Lane {lane.laneNumber} {lane.name ? `(${lane.name})` : ''} - {lane.status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !laneId}
            className="w-full btn bg-primary text-black disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register & Assign Lane'}
          </button>
        </form>
      </div>
    </div>
  );
}
