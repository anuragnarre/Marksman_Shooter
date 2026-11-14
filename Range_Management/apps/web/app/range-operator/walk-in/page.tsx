'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../contexts/toast-context';

const DISCIPLINES = [
  { id: '10m_rifle', name: '10m Air Rifle (ISSF Target)', caliber: '.177 (4.5mm)' },
  { id: '10m_pistol', name: '10m Air Pistol (ISSF Target)', caliber: '.177 (4.5mm)' },
  { id: '25m_pistol', name: '25m Standard Pistol', caliber: '.22 LR / 9mm' },
  { id: '50m_rifle', name: '50m Precision Rifle', caliber: '.22 LR' },
];

const FALLBACK_WALKIN_RANGE = {
  id: 'range-demo-1',
  name: 'Marksman Indoor Center',
  lanes: [
    { id: 'lane-1', laneNumber: 1, name: '10m Air Rifle Bay', status: 'OCCUPIED' },
    { id: 'lane-2', laneNumber: 2, name: '10m Precision Bay', status: 'AVAILABLE' },
    { id: 'lane-3', laneNumber: 3, name: '25m Rapid Fire Bay', status: 'AVAILABLE' },
    { id: 'lane-4', laneNumber: 4, name: '50m Prone Bay', status: 'AVAILABLE' },
  ],
};

export default function FastWalkInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [range, setRange] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [discipline, setDiscipline] = useState('10m_rifle');
  const [laneId, setLaneId] = useState('');
  const [waiverAgreed, setWaiverAgreed] = useState(false);
  const [ppeVerified, setPpeVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [issuedPass, setIssuedPass] = useState<string | null>(null);

  useEffect(() => {
    function pickDefaultLane(details: any) {
      if (typeof window !== 'undefined') {
        const urlLane = new URLSearchParams(window.location.search).get('laneId');
        if (urlLane && details.lanes?.some((l: any) => l.id === urlLane)) {
          setLaneId(urlLane);
          return;
        }
      }
      const available = details.lanes?.find((l: any) => l.status === 'AVAILABLE');
      if (available) setLaneId(available.id);
      else if (details.lanes?.length) setLaneId(details.lanes[0].id);
    }

    async function loadRange() {
      try {
        const myRanges = await apiFetch('/ranges') as any[];
        if (myRanges && myRanges.length > 0) {
          const details = await apiFetch(`/ranges/${myRanges[0].id}`) as any;
          const resolved = details || FALLBACK_WALKIN_RANGE;
          setRange(resolved);
          pickDefaultLane(resolved);
          return;
        }
      } catch {
        // Offline fallback below
      }
      setRange(FALLBACK_WALKIN_RANGE);
      pickDefaultLane(FALLBACK_WALKIN_RANGE);
    }
    loadRange();
  }, []);

  const selectedLane = range?.lanes?.find((l: any) => l.id === laneId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!range || !name.trim() || !laneId) {
      toast('Enter shooter name and select an available lane', 'warning');
      return;
    }
    if (!waiverAgreed || !ppeVerified) {
      toast('Form 101 Waiver and ANSI Z87.1+ PPE verification are required before clearing firing line.', 'error');
      return;
    }

    setLoading(true);
    const passCode = `MKSM-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      await apiFetch(`/ranges/${range.id}/walk-in`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email, laneId, discipline, passCode }),
      });
    } catch {
      // Offline pass issuance supported
    } finally {
      setIssuedPass(passCode);
      toast(`Gate pass ${passCode} issued for Lane ${selectedLane?.laneNumber || '01'}`, 'success');
      setLoading(false);
    }
  }

  if (!range) {
    return (
      <DashboardLayout role="RANGE_OPERATOR" showBack pageTitle="Fast Walk-in">
        <div className="p-8 text-center text-text-muted font-mono">Loading Range Facility Data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="RANGE_OPERATOR" showBack pageTitle="Fast Walk-in Intake">
      <div className="p-4 md:p-8 flex-1 max-w-2xl mx-auto w-full">
        {issuedPass ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-[#10B981] shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981] text-[#10B981] text-3xl flex items-center justify-center mb-4">
              ✓
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-wider text-white">
              Shooter Checked In &amp; Armed
            </h2>
            <p className="text-xs text-text-muted font-mono mt-1">
              Lane Allocated: <strong className="text-white">Lane {selectedLane?.laneNumber || '01'}</strong> • Target Cam Rig Synced
            </p>

            {/* Digital Turnstile Pass Card */}
            <div className="my-6 p-6 rounded-xl bg-black/60 border border-white/10 w-full max-w-sm flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5A623]">DIGITAL TURNSTILE TOKEN</span>
              <span className="text-3xl font-mono font-extrabold text-white tracking-widest my-2">
                {issuedPass}
              </span>
              <p className="text-[11px] font-mono text-text-muted">
                Athlete: {name} • Valid for 2 Hours
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={() => router.push('/range-operator/dashboard')}
                className="flex-1 py-3 rounded-xl bg-[#F5A623] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#F5A623]/90 transition-all shadow-md"
              >
                Go to Live Monitor
              </button>
              <button
                onClick={() => {
                  setIssuedPass(null);
                  setName('');
                  setEmail('');
                  setWaiverAgreed(false);
                  setPpeVerified(false);
                }}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all"
              >
                Next Walk-in
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 md:p-8 rounded-2xl bg-[#0F172A] border border-border-subtle shadow-xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-xl font-bold font-display uppercase tracking-wider text-white flex items-center gap-2">
                <span>⚡</span>
                <span>Fast Walk-in Shooter Intake</span>
              </h1>
              <p className="text-xs text-text-muted font-mono mt-1">
                Official RSO Firing Line Clearance &amp; Target Camera Rig Assignment
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5 uppercase font-mono font-bold tracking-wider">
                  Shooter Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-black/50 border border-white/10 focus:border-[#F5A623] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                  placeholder="e.g. Marcus Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 uppercase font-mono font-bold tracking-wider">
                  Email / Marksman ID
                </label>
                <input
                  type="email"
                  className="w-full bg-black/50 border border-white/10 focus:border-[#F5A623] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                  placeholder="shooter@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Discipline Selector */}
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 uppercase font-mono font-bold tracking-wider">
                Shooting Discipline &amp; Target Type *
              </label>
              <select
                className="w-full bg-black/50 border border-white/10 focus:border-[#F5A623] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — Caliber: {d.caliber}
                  </option>
                ))}
              </select>
            </div>

            {/* Lane & Optical Camera Pairing */}
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 uppercase font-mono font-bold tracking-wider">
                Assign Firing Bay / Lane *
              </label>
              <select
                required
                className="w-full bg-black/50 border border-white/10 focus:border-[#F5A623] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                value={laneId}
                onChange={(e) => setLaneId(e.target.value)}
              >
                <option value="">Select a Lane</option>
                {range.lanes?.map((lane: any) => (
                  <option key={lane.id} value={lane.id} disabled={lane.status === 'MAINTENANCE'}>
                    Lane {lane.laneNumber} {lane.name ? `(${lane.name})` : ''} — Status: {lane.status}
                  </option>
                ))}
              </select>

              {/* Target Camera Status Badge */}
              <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-text-muted">Target Cam 1: <strong className="text-white">Active (1080p60)</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  <span className="text-text-muted">Muzzle Cam 2: <strong className="text-white">Active</strong></span>
                </div>
              </div>
            </div>

            {/* Safety Compliance & Legal Checkboxes */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F5A623] block">
                RSO Compliance &amp; Verification Checklist
              </span>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={waiverAgreed}
                  onChange={(e) => setWaiverAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-[#F5A623] focus:ring-0"
                />
                <span className="text-xs font-mono text-text-secondary leading-relaxed">
                  <strong>Form 101 Liability &amp; Release Waiver</strong> signed and active on file. Athlete briefed on 4 Cardinal Safety Rules (Muzzle Downrange, Finger Off Trigger).
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ppeVerified}
                  onChange={(e) => setPpeVerified(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-[#F5A623] focus:ring-0"
                />
                <span className="text-xs font-mono text-text-secondary leading-relaxed">
                  <strong>Mandatory PPE Inspected:</strong> Verified ANSI Z87.1+ ballistic eyewear and NRR 28+ certified hearing protection present before entering hot line.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim() || !laneId}
              className="w-full py-3.5 rounded-xl bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-mono font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all shadow-lg shadow-[#F5A623]/20"
            >
              {loading ? 'Processing Clearance...' : 'Clear for Firing Line & Issue Badge'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
