"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, UserPlus, CreditCard, ShieldCheck, Building2, User, MoreVertical, Shield, Wallet, BadgeCheck } from "lucide-react";

export default function MembershipsPage() {
  const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "ORGANIZATION">("INDIVIDUAL");

  const members = [
    { id: "M-1029", name: "Alex Mercer", tier: "ELITE", status: "ACTIVE", nextBill: "2026-10-01", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", visits: 42 },
    { id: "M-1030", name: "Sarah Chen", tier: "STANDARD", status: "ACTIVE", nextBill: "2026-09-15", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", visits: 12 },
    { id: "M-1031", name: "Marcus Rodriguez", tier: "PRO", status: "EXPIRED", nextBill: "-", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus", visits: 89 },
    { id: "M-1032", name: "Emma Wilson", tier: "ELITE", status: "ACTIVE", nextBill: "2026-09-28", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma", visits: 56 },
  ];

  const organizations = [
    { id: "ORG-01", name: "Tactical Response Corp", type: "Corporate", status: "ACTIVE", memberCount: 24, pointOfContact: "John Smith" },
    { id: "ORG-02", name: "Phoenix Shooting Club", type: "Club", status: "ACTIVE", memberCount: 112, pointOfContact: "David Miller" },
    { id: "ORG-03", name: "Metro Police Dept", type: "Law Enforcement", status: "ACTIVE", memberCount: 450, pointOfContact: "Sgt. Davis" },
  ];

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="flex flex-col h-full gap-8">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Membership Directory</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage individual members, corporate accounts, and digital passes.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <Input placeholder={`Search ${activeTab.toLowerCase()}s...`} className="pl-10 bg-[var(--bg-void)] border-[var(--border-subtle)]" />
            </div>
            <Button variant="default" className="shrink-0 gap-2 bg-[var(--accent-primary)] hover:bg-[#c98e21] text-black font-semibold">
              <UserPlus size={16} /> Add {activeTab === "INDIVIDUAL" ? "Member" : "Organization"}
            </Button>
          </div>
        </section>

        {/* Custom Tabs */}
        <div className="flex gap-2 p-1 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-xl w-fit shrink-0">
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "INDIVIDUAL" ? "bg-[var(--bg-panel)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            onClick={() => setActiveTab("INDIVIDUAL")}
          >
            <User size={16} /> Individuals
          </button>
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "ORGANIZATION" ? "bg-[var(--bg-panel)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            onClick={() => setActiveTab("ORGANIZATION")}
          >
            <Building2 size={16} /> Corporate & Clubs
          </button>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            
            {activeTab === "INDIVIDUAL" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                  <GlassCard key={member.id} className="p-0 overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-colors group">
                    {/* Digital Card Top */}
                    <div className="h-24 bg-gradient-to-r from-[var(--bg-panel)] to-[var(--bg-void)] p-4 border-b border-[var(--border-subtle)] flex justify-between relative overflow-hidden">
                      {/* Holographic effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[var(--accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-void)] overflow-hidden shrink-0">
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{member.name}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-mono">{member.id}</p>
                        </div>
                      </div>
                      
                      <div className="text-right relative z-10">
                        <BadgeCheck size={24} className={member.tier === "ELITE" ? "text-[var(--accent-primary)]" : "text-[var(--data-blue)]"} />
                      </div>
                    </div>
                    
                    {/* Digital Card Bottom */}
                    <div className="p-4 bg-[var(--bg-void)] flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-1">Membership Tier</p>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            member.tier === 'ELITE' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20' :
                            'bg-[var(--data-blue)]/10 text-[var(--data-blue)] border border-[var(--data-blue)]/20'
                          }`}>
                            {member.tier}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-1">Status</p>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            member.status === 'ACTIVE' ? 'bg-[var(--emerald-signal)]/10 text-[var(--emerald-signal)]' : 'bg-[var(--signal-red)]/10 text-[var(--signal-red)]'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Wallet size={14} /> Next Bill: <span className="text-white font-mono">{member.nextBill}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--data-blue)]">Manage</Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {organizations.map((org) => (
                  <GlassCard key={org.id} className="p-5 flex items-center justify-between border border-[var(--border-subtle)] hover:border-[var(--data-blue)]/50 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl bg-[rgba(79,195,247,0.1)] border border-[rgba(79,195,247,0.2)] flex items-center justify-center shrink-0">
                        <Building2 size={24} className="text-[var(--data-blue)]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white font-display">{org.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold">{org.type}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                          <span className="text-xs text-[var(--text-secondary)] font-mono">{org.id}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-1">Roster Size</p>
                        <p className="text-xl font-data font-bold text-white">{org.memberCount}</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-1">POC</p>
                        <p className="text-sm font-medium text-white">{org.pointOfContact}</p>
                      </div>
                      <Button variant="outline" size="sm">Manage Accounts</Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

          </div>

          <div className="space-y-6">
            <Card className="border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xl">
              <CardHeader className="border-b border-[var(--border-subtle)] pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield size={18} className="text-[var(--accent-primary)]" /> Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-[var(--bg-void)] border-[var(--border-subtle)] hover:border-[var(--signal-red)] hover:text-[var(--signal-red)] group">
                  <CreditCard size={18} className="text-[var(--text-muted)] group-hover:text-[var(--signal-red)]" /> Review Failed Billings (3)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-[var(--bg-void)] border-[var(--border-subtle)] hover:border-[var(--warning)] hover:text-[var(--warning)] group">
                  <ShieldCheck size={18} className="text-[var(--text-muted)] group-hover:text-[var(--warning)]" /> Expiring Waivers (12)
                </Button>
                <div className="pt-4 mt-2 border-t border-[var(--border-subtle)]">
                  <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-3">Organization Tools</p>
                  <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-[var(--bg-void)] border-[var(--border-subtle)] text-[var(--data-blue)] hover:bg-[rgba(79,195,247,0.1)] hover:border-[var(--data-blue)] border-dashed">
                    <Building2 size={18} /> Bulk Roster Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <GlassCard className="p-5 border-t-4 border-t-[var(--emerald-signal)]">
              <h3 className="text-sm uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-4">Membership Health</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-muted)]">Active vs Churn</span>
                    <span className="text-[var(--emerald-signal)] font-bold">94% Retention</span>
                  </div>
                  <div className="w-full bg-[var(--bg-void)] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--emerald-signal)] h-full" style={{ width: '94%' }} />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
