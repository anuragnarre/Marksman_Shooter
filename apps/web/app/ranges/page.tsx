// apps/web/app/ranges/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../contexts/toast-context';

interface RangeLocation {
  id: string;
  name: string;
  status: string;
  maxDistance?: number;
  altitude?: number;
  gpsCoordinates?: string;
  typicalWindDir?: string;
  maxCaliber?: string;
}

const EMPTY_FORM = { name: '', status: 'Active', maxDistance: '', altitude: '', gpsCoordinates: '', typicalWindDir: '', maxCaliber: '' };

export default function RangesPage() {
  const { toast } = useToast();
  const [ranges, setRanges] = useState<RangeLocation[]>([]);
  const [selected, setSelected] = useState<RangeLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<RangeLocation[]>('/ranges');
      setRanges(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch {
      toast?.('Failed to load ranges.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, maxDistance: form.maxDistance ? +form.maxDistance : null, altitude: form.altitude ? +form.altitude : null };
      const created = await apiFetch<RangeLocation>('/ranges', { method: 'POST', body: JSON.stringify(payload) });
      setRanges(prev => [created, ...prev]);
      setSelected(created);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast?.('Range added!', 'success');
    } catch {
      toast?.('Failed to add range.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/ranges/${id}`, { method: 'DELETE' });
      const next = ranges.filter(r => r.id !== id);
      setRanges(next);
      setSelected(next[0] ?? null);
      toast?.('Range removed.', 'success');
    } catch {
      toast?.('Failed to delete range.', 'error');
    }
  };

  return (
    <AppShell title="Ranges">
      <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">Range Locations</h1>
            <p className="font-body text-[15px] text-text-secondary max-w-2xl leading-relaxed">
              Manage technical specifications and environmental data across multiple shooting facilities.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent text-bg-void px-6 py-3.5 rounded-xl font-display font-bold text-[13px] tracking-wide flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            ADD RANGE
          </button>
        </div>

        {/* Add Range Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-xl text-text-primary">Add New Range</h2>
                <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'name', label: 'Range Name', required: true, type: 'text' },
                  { key: 'maxDistance', label: 'Max Distance (Yards)', type: 'number' },
                  { key: 'altitude', label: 'Altitude (ft)', type: 'number' },
                  { key: 'gpsCoordinates', label: 'GPS Coordinates', type: 'text' },
                  { key: 'typicalWindDir', label: 'Typical Wind Direction', type: 'text' },
                  { key: 'maxCaliber', label: 'Max Allowable Caliber', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">{label}</label>
                    <input
                      className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl font-display font-bold text-[13px] uppercase tracking-wide border border-border-subtle text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-3 rounded-xl font-display font-bold text-[13px] uppercase tracking-wide bg-accent text-bg-void hover:brightness-110 disabled:opacity-60 transition-all">
                  {saving ? 'Saving...' : 'Save Range'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          {/* Left: Range List */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)
            ) : ranges.length === 0 ? (
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-8 text-center">
                <p className="text-text-muted text-sm mb-4">No ranges added yet.</p>
                <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm">Add First Range</button>
              </div>
            ) : ranges.map((range) => (
              <div
                key={range.id}
                onClick={() => setSelected(range)}
                className={`rounded-xl p-6 shadow-sm cursor-pointer relative overflow-hidden transition-colors ${selected?.id === range.id ? 'bg-bg-void border border-accent/40' : 'bg-bg-surface border border-border-subtle hover:border-border-strong'}`}
              >
                {selected?.id === range.id && <div className="absolute top-0 left-0 w-1 h-full bg-accent" />}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-display font-bold text-xl text-text-primary">{range.name}</h3>
                  <span className={`px-2.5 py-1 rounded-md font-display font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 border ${range.status === 'Active' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-bg-void text-text-muted border-border-subtle'}`}>
                    {range.status}
                  </span>
                </div>
                <div className="font-mono text-[13px] text-text-secondary grid grid-cols-2 gap-y-2">
                  {range.maxDistance && <div><span className="block font-display text-[10px] uppercase tracking-wider text-text-muted">Max Distance</span>{range.maxDistance} yds</div>}
                  {range.altitude && <div><span className="block font-display text-[10px] uppercase tracking-wider text-text-muted">Altitude</span>{range.altitude.toLocaleString()} ft</div>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(range.id); }} className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Right: Detail View */}
          <div className="xl:col-span-8 flex flex-col gap-6 md:gap-8">
            {selected ? (
              <div className="bg-bg-void border border-border-subtle rounded-xl overflow-hidden shadow-sm">
                {/* Map placeholder */}
                <div className="h-48 md:h-56 bg-bg-surface relative w-full border-b border-border-subtle overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">MAP VIEW — {selected.name.toUpperCase()}</span>
                  </div>
                  {selected.gpsCoordinates && (
                    <div className="absolute bottom-4 left-4 bg-bg-void/80 backdrop-blur-md border border-border-subtle p-3 rounded-lg font-mono text-[13px] text-text-primary shadow-sm">
                      <span className="block font-display text-[10px] uppercase tracking-wider text-text-muted mb-1">GPS</span>
                      {selected.gpsCoordinates}
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8">
                  <h2 className="font-display font-bold text-2xl text-text-primary mb-8 pb-5 border-b border-border-subtle">Technical Specifications</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {[
                      { label: 'Elevation / Altitude', val: selected.altitude ? `${selected.altitude.toLocaleString()} ft` : '—' },
                      { label: 'Typical Wind Dir.', val: selected.typicalWindDir ?? '—' },
                      { label: 'Max Allowable Caliber', val: selected.maxCaliber ?? '—' },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex flex-col border-l-2 border-accent pl-4">
                        <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-1.5">{label}</span>
                        <span className="font-mono text-text-primary text-xl">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Environmental Log */}
                  <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
                    <h3 className="font-display font-semibold text-[13px] uppercase tracking-widest text-text-primary flex items-center gap-2 mb-6">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                      Environmental Log History
                    </h3>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left font-mono min-w-[500px]">
                        <thead>
                          <tr className="border-b border-border-subtle text-text-muted font-display font-semibold text-[11px] tracking-wider uppercase">
                            <th className="py-3 px-3">Time</th><th className="py-3 px-3">Temp (°F)</th>
                            <th className="py-3 px-3">Humidity</th><th className="py-3 px-3">Pressure (inHg)</th>
                            <th className="py-3 px-3">Wind (mph)</th>
                          </tr>
                        </thead>
                        <tbody className="text-text-primary text-[13px]">
                          {[
                            { t: '14:00', tm: '78.2', h: '32%', p: '29.84', w: '8.5 NW' },
                            { t: '13:00', tm: '76.5', h: '34%', p: '29.86', w: '7.2 NW' },
                            { t: '12:00', tm: '74.1', h: '38%', p: '29.88', w: '5.0 NNW' },
                            { t: '11:00', tm: '69.8', h: '45%', p: '29.91', w: '3.1 N' },
                          ].map((row, i) => (
                            <tr key={i} className="border-b border-border-subtle/40 hover:bg-bg-void transition-colors">
                              <td className="py-3.5 px-3">{row.t}</td><td className="py-3.5 px-3">{row.tm}</td>
                              <td className="py-3.5 px-3">{row.h}</td><td className="py-3.5 px-3">{row.p}</td>
                              <td className="py-3.5 px-3">{row.w}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-16 flex items-center justify-center text-center">
                <div>
                  <svg className="mx-auto mb-4 opacity-20" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                  <p className="text-text-muted font-display text-sm">Select a range to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
