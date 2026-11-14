"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Calendar as CalendarIcon, User, Edit3, Award, Flame, Target, X, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/contexts/toast-context";

interface ShooterVitals {
  displayName: string;
  discipline: string;
  stance: string;
  dominantEye: string;
  heightCm: string;
  dob: string;
}

interface LicenseItem {
  id: string;
  title: string;
  subtitle: string;
  expires: string;
  urgent?: boolean;
}

const VITALS_KEY = 'marksman_shooter_vitals_v1';
const LICENSES_KEY = 'marksman_shooter_licenses_v1';

const DEFAULT_LICENSES: LicenseItem[] = [
  { id: 'lic-1', title: 'ISSF Competitor', subtitle: 'ID: 994218-ISSF', expires: 'Dec 2027', urgent: false },
  { id: 'lic-2', title: 'National Range Safety', subtitle: 'Level 2 Certified', expires: 'In 14 Days', urgent: true },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [vitals, setVitals] = useState<ShooterVitals>({
    displayName: user?.name || 'Alex Marksman',
    discipline: '10m Air Rifle Specialist',
    stance: 'Standing',
    dominantEye: 'Right',
    heightCm: '182 cm',
    dob: '12 Oct 1995',
  });
  const [licenses, setLicenses] = useState<LicenseItem[]>(DEFAULT_LICENSES);
  const [stats, setStats] = useState({ streakDays: 12, avgScore: 10.42, rank: 'Master' });

  const [editOpen, setEditOpen] = useState(false);
  const [draftVitals, setDraftVitals] = useState<ShooterVitals>(vitals);

  const [licModalOpen, setLicModalOpen] = useState(false);
  const [newLicTitle, setNewLicTitle] = useState('');
  const [newLicSub, setNewLicSub] = useState('');
  const [newLicExp, setNewLicExp] = useState('Dec 2028');

  useEffect(() => {
    try {
      const savedVitals = localStorage.getItem(VITALS_KEY);
      if (savedVitals) {
        const parsed = JSON.parse(savedVitals);
        setVitals((prev) => ({ ...prev, ...parsed }));
      } else if (user?.name) {
        setVitals((prev) => ({ ...prev, displayName: user.name }));
      }
      const savedLic = localStorage.getItem(LICENSES_KEY);
      if (savedLic) {
        const parsed = JSON.parse(savedLic);
        if (Array.isArray(parsed)) setLicenses(parsed);
      }
    } catch {}
  }, [user?.name]);

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/analytics/overview').catch(() => null),
      apiFetch<any[]>('/sessions').catch(() => null),
    ]).then(([ov, sess]) => {
      if (ov && typeof ov.overallAverage === 'number' && ov.overallAverage > 0) {
        const avg = ov.overallAverage;
        const rank = avg >= 10.3 ? 'Master' : avg >= 9.9 ? 'Expert' : avg >= 9.3 ? 'Sharpshooter' : 'Marksman';
        const sessionCount = Array.isArray(sess) ? sess.length : (ov.sessionTrend?.length ?? 12);
        setStats({ streakDays: Math.max(1, sessionCount), avgScore: Number(avg.toFixed(2)), rank });
      }
    });
  }, []);

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    setVitals(draftVitals);
    try { localStorage.setItem(VITALS_KEY, JSON.stringify(draftVitals)); } catch {}
    setEditOpen(false);
    toast?.('Profile details saved', 'success');
  };

  const handleAddLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicTitle.trim()) return;
    const item: LicenseItem = {
      id: `lic-${Date.now().toString(36)}`,
      title: newLicTitle.trim(),
      subtitle: newLicSub.trim() || 'Verified Credential',
      expires: newLicExp.trim() || 'Dec 2028',
      urgent: false,
    };
    const next = [item, ...licenses];
    setLicenses(next);
    try { localStorage.setItem(LICENSES_KEY, JSON.stringify(next)); } catch {}
    setNewLicTitle('');
    setNewLicSub('');
    setLicModalOpen(false);
    toast?.(`Added "${item.title}"`, 'success');
  };

  const handleDeleteLicense = (id: string) => {
    const next = licenses.filter((l) => l.id !== id);
    setLicenses(next);
    try { localStorage.setItem(LICENSES_KEY, JSON.stringify(next)); } catch {}
    toast?.('License removed', 'info');
  };

  return (
    <DashboardLayout role="SHOOTER">
      <div className="flex flex-col gap-8">
        
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-[var(--bg-elevated)] border-2 border-[var(--border-accent)] shadow-glow-accent flex items-center justify-center overflow-hidden">
                <User size={48} className="text-[var(--accent-primary)]" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[var(--bg-void)] flex items-center justify-center border border-[var(--border-subtle)]">
                <ShieldCheck size={20} className="text-[#00E5A0]" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">{vitals.displayName}</h1>
              <p className="text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                <Target size={16} className="text-[var(--accent-primary)]" /> {vitals.discipline}
              </p>
              {user?.email && (
                <p className="text-xs font-mono text-[var(--text-muted)] mt-1">{user.email} &bull; {user.role}</p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="shrink-0 gap-2"
            onClick={() => { setDraftVitals(vitals); setEditOpen(true); }}
          >
            <Edit3 size={16} /> Edit Profile
          </Button>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Flame size={24} className="text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Training Sessions</p>
              <h3 className="text-2xl font-bold font-display text-[var(--text-primary)]">{stats.streakDays} Logged</h3>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Target size={24} className="text-[var(--data-blue)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Avg Score (Season)</p>
              <h3 className="text-2xl font-bold font-display text-[var(--text-primary)]">{stats.avgScore.toFixed(2)}</h3>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Award size={24} className="text-[#00E5A0]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Classification</p>
              <h3 className="text-2xl font-bold font-display text-[var(--text-primary)]">{stats.rank}</h3>
            </div>
          </GlassCard>
        </section>

        {/* Vital Info & Licenses */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Physical Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Stance</p>
                  <p className="text-[var(--text-primary)] font-medium">{vitals.stance}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Dominant Eye</p>
                  <p className="text-[var(--text-primary)] font-medium">{vitals.dominantEye}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Height</p>
                  <p className="text-[var(--text-primary)] font-medium">{vitals.heightCm}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Date of Birth</p>
                  <p className="text-[var(--text-primary)] font-medium">{vitals.dob}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Licenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Licenses &amp; Certifications</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLicModalOpen(true)}>Add New</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {licenses.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">No licenses recorded.</p>
              ) : licenses.map((lic) => (
                <div key={lic.id} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} className={lic.urgent ? "text-[var(--accent-primary)]" : "text-[#00E5A0]"} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-[var(--text-primary)] truncate">{lic.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{lic.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Expires</p>
                      <p className={`text-sm font-medium flex items-center gap-1 ${lic.urgent ? 'text-[var(--signal-red)]' : 'text-[#00E5A0]'}`}>
                        {lic.urgent && <CalendarIcon size={12} />} {lic.expires}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLicense(lic.id)}
                      aria-label={`Remove ${lic.title}`}
                      className="text-[var(--text-muted)] hover:text-[var(--signal-red)] p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </section>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <form onSubmit={handleSaveVitals} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Edit Shooter Profile</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            {[
              { key: 'displayName', label: 'Full Name' },
              { key: 'discipline', label: 'Primary Discipline' },
              { key: 'stance', label: 'Stance' },
              { key: 'dominantEye', label: 'Dominant Eye' },
              { key: 'heightCm', label: 'Height' },
              { key: 'dob', label: 'Date of Birth' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-[11px] font-display uppercase tracking-wider text-[var(--text-muted)] mb-1">{label}</label>
                <input
                  value={(draftVitals as any)[key]}
                  onChange={(e) => setDraftVitals((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-[var(--accent-primary)] text-black">Save Profile</Button>
            </div>
          </form>
        </div>
      )}

      {/* Add License Modal */}
      {licModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <form onSubmit={handleAddLicense} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Add License / Certification</h2>
              <button type="button" onClick={() => setLicModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-display uppercase tracking-wider text-[var(--text-muted)] mb-1">Credential Title</label>
              <input
                required
                placeholder="e.g., NRA Smallbore Classification"
                value={newLicTitle}
                onChange={(e) => setNewLicTitle(e.target.value)}
                className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-display uppercase tracking-wider text-[var(--text-muted)] mb-1">License ID / Notes</label>
              <input
                placeholder="e.g., ID: 4481-IND"
                value={newLicSub}
                onChange={(e) => setNewLicSub(e.target.value)}
                className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-display uppercase tracking-wider text-[var(--text-muted)] mb-1">Expiration Date</label>
              <input
                value={newLicExp}
                onChange={(e) => setNewLicExp(e.target.value)}
                className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setLicModalOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-[var(--accent-primary)] text-black">Add Credential</Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
