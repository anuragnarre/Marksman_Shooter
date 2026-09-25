"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { User, Shield, Activity, Phone, FileText, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ShooterProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profiles = await apiFetch<any[]>('/shooter-profile/all');
        if (profiles && profiles.length > 0) {
          setProfile(profiles[0]);
        }
      } catch (err) {
        console.error("Failed to load shooter profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="SHOOTER">
        <div className="p-8 text-on-surface">Loading profile...</div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role="SHOOTER">
        <div className="p-8 text-on-surface">No profile found.</div>
      </DashboardLayout>
    );
  }

  const profileCompleteness = 75; // Mock

  return (
    <DashboardLayout role="SHOOTER">
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header & Completeness */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-surface-container-highest border-4 border-surface flex items-center justify-center shadow-lg relative">
              <span className="text-4xl font-bold text-on-surface-variant">{profile.firstName[0]}</span>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center border-2 border-surface shadow-md hover:bg-primary/90 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">{profile.firstName} {profile.lastName}</h1>
              <p className="text-on-surface-variant mt-1 font-medium">{profile.type || 'Competitive Shooter'}</p>
            </div>
          </div>
          
          <div className="w-full md:w-64 bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-on-surface">Profile Completeness</span>
              <span className="text-sm font-bold text-primary">{profileCompleteness}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${profileCompleteness}%` }}
              ></div>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">Add medical notes to reach 100%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Athlete Details */}
          <div className="space-y-6">
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <User className="text-primary" size={24} />
                <h2 className="text-xl font-display font-bold text-on-surface">Athlete Details</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Date of Birth</label>
                    <Input defaultValue="1995-04-12" type="date" className="bg-surface border-outline-variant/50 h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Gender</label>
                    <select className="w-full bg-surface border border-outline-variant/50 rounded-lg h-10 px-3 text-on-surface text-sm focus:border-primary focus:outline-none">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Dominant Hand</label>
                    <select className="w-full bg-surface border border-outline-variant/50 rounded-lg h-10 px-3 text-on-surface text-sm focus:border-primary focus:outline-none">
                      <option>Right</option>
                      <option>Left</option>
                      <option>Ambidextrous</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Eye Dominance</label>
                    <select className="w-full bg-surface border border-outline-variant/50 rounded-lg h-10 px-3 text-on-surface text-sm focus:border-primary focus:outline-none">
                      <option>Right</option>
                      <option>Left</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Primary Stance</label>
                  <select className="w-full bg-surface border border-outline-variant/50 rounded-lg h-10 px-3 text-on-surface text-sm focus:border-primary focus:outline-none">
                    <option>Standing</option>
                    <option>Prone</option>
                    <option>Kneeling</option>
                    <option>Benchrest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Physical Attributes */}
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <Activity className="text-tertiary" size={24} />
                <h2 className="text-xl font-display font-bold text-on-surface">Physical Attributes</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Height (cm)</label>
                  <Input defaultValue="178" type="number" className="bg-surface border-outline-variant/50 h-10 text-center" />
                </div>
                <div>
                  <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Weight (kg)</label>
                  <Input defaultValue="74.5" type="number" step="0.1" className="bg-surface border-outline-variant/50 h-10 text-center" />
                </div>
                <div>
                  <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Wingspan (cm)</label>
                  <Input defaultValue="182" type="number" className="bg-surface border-outline-variant/50 h-10 text-center" />
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-4">
                * Used by AI Coach to evaluate stance biomechanics and recommend adjustments.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Licenses & Certifications */}
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-outline-variant/30 pb-4">
                <div className="flex items-center gap-3">
                  <Shield className="text-[#42A5F5]" size={24} />
                  <h2 className="text-xl font-display font-bold text-on-surface">Licenses & Certifications</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
                  <Plus size={16} className="mr-1" /> Add New
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-surface border border-outline-variant/30 rounded-xl">
                  <div>
                    <h3 className="font-bold text-on-surface">ISSF Shooter ID</h3>
                    <p className="text-sm text-on-surface-variant">ID: IND-1995-M-00142</p>
                    <p className="text-xs text-on-surface-variant mt-1">Issued: Jan 2024</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-secondary bg-secondary-container px-2 py-1 rounded-md uppercase tracking-wider">
                      <CheckCircle2 size={12} /> Valid
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between p-4 bg-surface border border-outline-variant/30 rounded-xl">
                  <div>
                    <h3 className="font-bold text-on-surface">State Rifle Association</h3>
                    <p className="text-sm text-on-surface-variant">ID: MH-SRA-8842</p>
                    <p className="text-xs text-on-surface-variant mt-1">Expires: Dec 15, 2026</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-[#FFB74D] bg-[#FFB74D]/10 px-2 py-1 rounded-md uppercase tracking-wider border border-[#FFB74D]/20">
                      <AlertTriangle size={12} /> Expiring Soon
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-[#FFB74D] text-[#FFB74D] hover:bg-[#FFB74D]/10">
                      Renew
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency & Medical */}
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <Phone className="text-[#FF5252]" size={24} />
                <h2 className="text-xl font-display font-bold text-on-surface">Emergency Contact</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Contact Name</label>
                  <Input defaultValue="Jane Doe" className="bg-surface border-outline-variant/50 h-10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Relationship</label>
                    <Input defaultValue="Spouse" className="bg-surface border-outline-variant/50 h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-label-caps uppercase text-on-surface-variant mb-1 block">Phone Number</label>
                    <Input defaultValue="+1 (555) 019-2834" className="bg-surface border-outline-variant/50 h-10" />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-outline-variant/30">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-on-surface-variant" size={20} />
                  <h3 className="font-bold text-on-surface">Medical Notes (Coach Only)</h3>
                </div>
                <textarea 
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3 text-sm text-on-surface focus:border-primary focus:outline-none min-h-[100px] resize-none"
                  placeholder="Any medical conditions, allergies, or physical restrictions your coach should know about..."
                  defaultValue="Mild astigmatism in left eye. Right shoulder injury (rotator cuff) in 2022, fully recovered but occasional stiffness."
                ></textarea>
                <p className="text-xs text-on-surface-variant mt-2">
                  * These notes are private and only visible to you and your connected coach.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-outline-variant/30">
          <Button className="bg-primary text-on-primary hover:bg-primary/90 font-bold px-8 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            Save Profile
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
