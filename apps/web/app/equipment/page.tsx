// apps/web/app/equipment/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../contexts/toast-context';

interface Equipment {
  id: string;
  name: string;
  type: string;
  caliber?: string;
  status: string;
  roundCount: number;
  regPressure?: string;
  lastCleaned?: string;
  nextService?: number;
  barrelLifePct?: number;
}

const EMPTY_FORM = {
  name: '',
  type: 'FIREARM',
  caliber: '',
  status: 'Active',
  roundCount: 0,
  regPressure: '',
  nextService: 5000,
  barrelLifePct: 100,
};

function BarrelLifeBar({ pct }: { pct: number }) {
  const color = pct > 50 ? '#F5A623' : pct > 20 ? '#FF8C00' : '#FF4D6D';
  return (
    <div>
      <div className="flex justify-between font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-2">
        <span>Barrel Life Remaining</span><span>{pct}%</span>
      </div>
      <div className="w-full bg-bg-void border border-border-subtle h-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Equipment[]>('/equipment');
      setItems(data);
    } catch {
      toast?.('Failed to load equipment.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const created = await apiFetch<Equipment>('/equipment', { method: 'POST', body: JSON.stringify(form) });
      setItems(prev => [created, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast?.('Equipment added!', 'success');
    } catch {
      toast?.('Failed to add equipment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/equipment/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
      toast?.('Equipment removed.', 'success');
    } catch {
      toast?.('Failed to delete.', 'error');
    }
  };

  const firearms = items.filter(i => i.type === 'FIREARM');
  const optics = items.filter(i => i.type === 'OPTIC');
  const ammo = items.filter(i => i.type === 'AMMO');

  return (
    <AppShell title="Equipment">
      <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
        {/* Header */}
        <header className="mb-10 flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">Equipment Inventory</h1>
            <p className="font-body text-[15px] text-text-secondary leading-relaxed">Manage firearms, optics, ammunition performance, and maintenance logs.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent text-bg-void px-6 py-3.5 rounded-xl font-display font-bold text-[13px] tracking-wide flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            ADD EQUIPMENT
          </button>
        </header>

        {/* Add Equipment Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-xl text-text-primary">Add New Equipment</h2>
                <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Type</label>
                  <select className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="FIREARM">Firearm / Air Rifle</option>
                    <option value="OPTIC">Optic / Scope</option>
                    <option value="AMMO">Ammunition</option>
                  </select>
                </div>
                {[
                  { key: 'name', label: 'Name / Model', type: 'text' },
                  { key: 'caliber', label: 'Caliber', type: 'text' },
                  { key: 'regPressure', label: 'Regulator Pressure / Power', type: 'text' },
                  { key: 'roundCount', label: 'Current Round Count', type: 'number' },
                  { key: 'nextService', label: 'Next Service (rounds from now)', type: 'number' },
                  { key: 'barrelLifePct', label: 'Barrel Life Remaining (%)', type: 'number' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">{label}</label>
                    <input
                      type={type}
                      className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl font-display font-bold text-[13px] uppercase tracking-wide border border-border-subtle text-text-secondary hover:text-text-primary">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-3 rounded-xl font-display font-bold text-[13px] uppercase tracking-wide bg-accent text-bg-void hover:brightness-110 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Equipment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
            {/* Left: Rifle Vault */}
            <section className="xl:col-span-8 flex flex-col gap-6">
              <div className="flex flex-wrap justify-between items-center border-b border-border-subtle pb-4 gap-4">
                <h2 className="font-display font-bold text-2xl text-text-primary">Rifle Vault</h2>
              </div>

              {firearms.length === 0 ? (
                <div className="bg-bg-surface border border-border-dashed rounded-xl p-10 text-center">
                  <p className="text-text-muted text-sm mb-3">No firearms added yet.</p>
                  <button onClick={() => { setForm(f => ({ ...f, type: 'FIREARM' })); setShowForm(true); }} className="text-accent text-sm font-display font-bold underline">Add your first firearm</button>
                </div>
              ) : firearms.map((rifle) => (
                <div key={rifle.id} className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm hover:border-border-strong transition-colors group relative">
                  <button onClick={() => handleDelete(rifle.id)} className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                  <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                    <div>
                      <h3 className="font-display font-bold text-xl text-text-primary mb-2">{rifle.name}</h3>
                      {rifle.caliber && <span className="bg-bg-surface border border-border-subtle text-text-muted font-display font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">{rifle.caliber}</span>}
                    </div>
                    <span className={`font-display font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border ${rifle.status === 'Active' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-bg-void text-text-muted border-border-subtle'}`}>{rifle.status}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Round Count', val: rifle.roundCount.toLocaleString() },
                      { label: 'Reg. Pressure', val: rifle.regPressure ?? '—' },
                      { label: 'Last Cleaned', val: rifle.lastCleaned ? new Date(rifle.lastCleaned).toLocaleDateString() : '—' },
                      { label: 'Next Service', val: rifle.nextService ? `In ${rifle.nextService.toLocaleString()} rds` : '—' },
                    ].map(({ label, val }) => (
                      <div key={label} className="border-l-2 border-accent/30 pl-3">
                        <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted block mb-1.5">{label}</span>
                        <span className="font-mono text-[13px] text-text-primary">{val}</span>
                      </div>
                    ))}
                  </div>
                  <BarrelLifeBar pct={rifle.barrelLifePct ?? 100} />
                </div>
              ))}
            </section>

            {/* Right: Optics + Ammo */}
            <section className="xl:col-span-4 flex flex-col gap-6">
              {/* Optics */}
              <div className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-5">
                  <h2 className="font-display font-bold text-xl text-text-primary">Optics</h2>
                  <button onClick={() => { setForm(f => ({ ...f, type: 'OPTIC' })); setShowForm(true); }} className="text-accent hover:brightness-110 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </div>
                {optics.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-4">No optics added.</p>
                ) : optics.map(o => (
                  <div key={o.id} className="mb-4 pb-4 border-b border-border-subtle last:border-0 last:mb-0 last:pb-0 group relative">
                    <button onClick={() => handleDelete(o.id)} className="absolute top-0 right-0 p-1 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                    <h4 className="font-display font-bold text-[15px] text-text-primary mb-1">{o.name}</h4>
                    {o.caliber && <p className="font-display text-[11px] uppercase tracking-wider text-text-muted">{o.caliber}</p>}
                  </div>
                ))}
              </div>

              {/* Ammo */}
              <div className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-5">
                  <h2 className="font-display font-bold text-xl text-text-primary">Ammo Data</h2>
                  <button onClick={() => { setForm(f => ({ ...f, type: 'AMMO' })); setShowForm(true); }} className="text-accent hover:brightness-110 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </div>
                {ammo.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-4">No ammo batches added.</p>
                ) : ammo.map(a => (
                  <div key={a.id} className="border border-border-subtle rounded-xl p-4 mb-3 last:mb-0 hover:border-accent/30 transition-colors group relative">
                    <button onClick={() => handleDelete(a.id)} className="absolute top-2 right-2 p-1 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-display font-bold text-[14px] text-text-primary">{a.name}</span>
                      {a.caliber && <span className="font-display font-bold text-[11px] uppercase tracking-wider bg-bg-surface border border-border-subtle text-text-muted px-2.5 py-1 rounded-md">{a.caliber}</span>}
                    </div>
                    {a.regPressure && <p className="font-mono text-[12px] text-text-muted">{a.regPressure}</p>}
                  </div>
                ))}
              </div>

              {/* Maintenance Reminder */}
              {firearms.some(f => (f.barrelLifePct ?? 100) < 50) && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <div>
                      <p className="font-display font-bold text-[13px] text-text-primary">Maintenance Recommended</p>
                      <p className="font-body text-[12px] text-text-secondary">Some firearms have low barrel life remaining.</p>
                    </div>
                  </div>
                  <button className="w-full font-display font-bold text-[12px] uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 hover:bg-accent/20 py-2.5 rounded-lg transition-colors">
                    Log Maintenance
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
