"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Calendar as CalendarIcon, User, Edit3, Award, Flame, Target } from "lucide-react";

export default function ProfilePage() {
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
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[var(--bg-void)] flex items-center justify-center">
                <ShieldCheck size={20} className="text-[var(--emerald-signal)]" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-display font-bold">Alex Mercer</h1>
              <p className="text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                <Target size={16} /> 10m Air Rifle Specialist
              </p>
            </div>
          </div>

          <Button variant="outline" className="shrink-0 gap-2">
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
              <p className="text-sm text-[var(--text-secondary)] font-medium">Training Streak</p>
              <h3 className="text-2xl font-bold font-display text-white">12 Days</h3>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Target size={24} className="text-[var(--data-blue)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Avg Score (30d)</p>
              <h3 className="text-2xl font-bold font-display text-white">10.42</h3>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Award size={24} className="text-[var(--emerald-signal)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Rank</p>
              <h3 className="text-2xl font-bold font-display text-white">Master</h3>
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
                  <p className="text-white font-medium">Standing</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Dominant Eye</p>
                  <p className="text-white font-medium">Right</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Height</p>
                  <p className="text-white font-medium">182 cm</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Date of Birth</p>
                  <p className="text-white font-medium">12 Oct 1995</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Licenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Licenses & Certifications</CardTitle>
              <Button variant="ghost" size="sm">Add New</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center">
                    <ShieldCheck size={20} className="text-[var(--emerald-signal)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">ISSF Competitor</h4>
                    <p className="text-xs text-[var(--text-secondary)]">ID: 994218-ISSF</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Expires</p>
                  <p className="text-sm font-medium text-[var(--emerald-signal)]">Dec 2027</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center">
                    <ShieldCheck size={20} className="text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">National Range Safety</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Level 2 Certified</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Expires</p>
                  <p className="text-sm font-medium text-[var(--signal-red)] flex items-center gap-1">
                    <CalendarIcon size={12} /> 14 Days
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

        </section>
      </div>
    </DashboardLayout>
  );
}
