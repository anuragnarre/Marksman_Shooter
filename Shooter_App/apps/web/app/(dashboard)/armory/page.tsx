"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Crosshair, Plus, AlertCircle, Wrench, Package, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

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
  serialNumber?: string;
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
  serialNumber: '',
};

function BarrelLifeBar({ pct }: { pct: number }) {
  const color = pct > 50 ? '#00E5A0' : pct > 20 ? '#F5A623' : '#FF4D6D';
  return (
    <div className="mt-4">
      <div className="flex justify-between font-display font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
        <span>Barrel Life Remaining</span><span>{pct}%</span>
      </div>
      <div className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ArmoryPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/equipment') as Equipment[];
      setItems(data);
    } catch (err) {
      console.error('Failed to load equipment.', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const created = await apiFetch('/equipment', { method: 'POST', body: JSON.stringify(form) }) as Equipment;
      setItems(prev => [created, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error('Failed to add equipment.', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/equipment/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Failed to delete.', err);
    }
  };

  const firearms = items.filter(i => i.type === 'FIREARM');
  const optics = items.filter(i => i.type === 'OPTIC');
  const ammo = items.filter(i => i.type === 'AMMO');

  return (
    <DashboardLayout role="SHOOTER">
      <div className="flex flex-col gap-8 relative">
        
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Armory</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Manage your firearms, optics, and ammunition inventory.
            </p>
          </div>
          <Button variant="default" className="shrink-0 gap-2" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Equipment
          </Button>
        </section>

        {/* Add Equipment Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-xl text-white">Add New Equipment</h2>
                <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-display text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Type</label>
                  <select className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-white font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="FIREARM">Firearm / Air Rifle</option>
                    <option value="OPTIC">Optic / Scope</option>
                    <option value="AMMO">Ammunition</option>
                  </select>
                </div>
                {[
                  { key: 'name', label: 'Name / Model', type: 'text' },
                  { key: 'caliber', label: 'Caliber', type: 'text' },
                  { key: 'serialNumber', label: 'Serial Number', type: 'text' },
                  { key: 'roundCount', label: 'Current Round Count', type: 'number' },
                  { key: 'nextService', label: 'Next Service (rounds from now)', type: 'number' },
                  { key: 'barrelLifePct', label: 'Barrel Life Remaining (%)', type: 'number' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block font-display text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">{label}</label>
                    <input
                      type={type}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-white font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 py-3">Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-3 bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/90">
                  {saving ? 'Saving...' : 'Save Equipment'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 animate-pulse bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)]" />)}
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main List */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-display text-xl font-bold border-b border-[var(--border-subtle)] pb-2">
                Primary Firearms
              </h3>
              
              {firearms.length === 0 ? (
                <div className="bg-[var(--bg-panel)] border border-dashed border-[var(--border-subtle)] rounded-xl p-10 text-center">
                  <p className="text-[var(--text-muted)] text-sm mb-3">No firearms added yet.</p>
                  <Button variant="outline" onClick={() => { setForm(f => ({ ...f, type: 'FIREARM' })); setShowForm(true); }} className="text-[var(--accent-primary)] border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10">
                    Add your first firearm
                  </Button>
                </div>
              ) : firearms.map(rifle => (
                <GlassCard key={rifle.id} className="p-6 flex flex-col md:flex-row gap-6 border border-[var(--border-accent)] group relative overflow-hidden">
                  <button onClick={() => handleDelete(rifle.id)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--signal-red)] transition-colors opacity-0 group-hover:opacity-100 z-10">
                    <Trash2 size={18} />
                  </button>
                  <div className="h-24 w-24 md:h-32 md:w-32 bg-[var(--bg-void)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                    <Crosshair size={40} className="text-[var(--text-muted)] opacity-50" />
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="pr-8">
                        <h4 className="text-xl font-bold text-white truncate">{rifle.name}</h4>
                        <p className="text-sm text-[var(--accent-primary)] truncate">{rifle.caliber || 'N/A'}</p>
                      </div>
                      <span className="bg-[rgba(245,166,35,0.15)] text-[var(--accent-primary)] px-2 py-1 rounded text-xs font-bold uppercase shrink-0 border border-[var(--accent-primary)]/20">
                        {rifle.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Rounds Fired</p>
                        <p className="text-white font-data">{rifle.roundCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Serial No.</p>
                        <p className="text-white font-data truncate">{rifle.serialNumber || 'N/A'}</p>
                      </div>
                    </div>

                    <BarrelLifeBar pct={rifle.barrelLifePct ?? 100} />

                    <div className="mt-6 flex items-center gap-3">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Wrench size={14} /> Log Service
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}

            </div>

            {/* Sidebar / Ammo Inventory */}
            <div className="space-y-6">
              {firearms.some(f => (f.barrelLifePct ?? 100) < 50) && (
                <Card className="border-[var(--signal-red)]/50 bg-[var(--signal-red)]/5">
                  <CardHeader className="pb-3 border-b border-[var(--signal-red)]/20 mb-3">
                    <CardTitle className="text-[var(--signal-red)] flex items-center gap-2">
                      <AlertCircle size={20} /> Action Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Some firearms are due for a deep clean and spring replacement.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-[var(--border-subtle)] mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package size={20} className="text-[var(--data-blue)]" />
                    Optics
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setForm(f => ({ ...f, type: 'OPTIC' })); setShowForm(true); }}>
                    <Plus size={14} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {optics.length === 0 ? (
                    <p className="text-xs text-center text-[var(--text-muted)] py-2">No optics added.</p>
                  ) : optics.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-[var(--bg-void)] rounded-lg border border-[var(--border-subtle)] group">
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-white text-sm truncate">{o.name}</p>
                        {o.serialNumber && <p className="text-xs text-[var(--text-muted)] truncate">SN: {o.serialNumber}</p>}
                      </div>
                      <button onClick={() => handleDelete(o.id)} className="text-[var(--text-muted)] hover:text-[var(--signal-red)] opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-[var(--border-subtle)] mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package size={20} className="text-[var(--emerald-signal)]" />
                    Ammunition Stock
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setForm(f => ({ ...f, type: 'AMMO' })); setShowForm(true); }}>
                    <Plus size={14} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ammo.length === 0 ? (
                    <p className="text-xs text-center text-[var(--text-muted)] py-2">No ammo added.</p>
                  ) : ammo.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-[var(--bg-void)] rounded-lg border border-[var(--border-subtle)] group">
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-white text-sm truncate">{a.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{a.caliber}</p>
                      </div>
                      <div className="text-right flex items-center gap-3 shrink-0">
                        <div>
                          <p className={`text-lg font-data font-bold ${a.roundCount < 500 ? 'text-[var(--warning)]' : 'text-white'}`}>{a.roundCount.toLocaleString()}</p>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase">Rounds</p>
                        </div>
                        <button onClick={() => handleDelete(a.id)} className="text-[var(--text-muted)] hover:text-[var(--signal-red)] opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full text-xs mt-2" size="sm" onClick={() => { setForm(f => ({ ...f, type: 'AMMO' })); setShowForm(true); }}>
                    <Plus size={14} className="mr-1" /> Add Ammo Lot
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
