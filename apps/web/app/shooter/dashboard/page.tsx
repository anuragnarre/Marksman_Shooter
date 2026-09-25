"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { Award, Target, Flame, TrendingUp, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/Button";

export default function ShooterDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from /shooter-profile/me
    // Since we don't have authentication fully mocked for the shooter yet, we will fetch all and pick the first
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
        <div className="p-8 text-on-surface">Loading athlete profile...</div>
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

  return (
    <DashboardLayout role="SHOOTER">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Welcome back, {profile.firstName}</h1>
            <p className="text-on-surface-variant text-lg mt-1">
              Your next training session is in <span className="text-primary font-bold">2 days</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl">
              <CalendarIcon size={18} /> View Schedule
            </Button>
            <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)] transition-all">
              <Target size={18} /> Start Session
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award size={64} className="text-primary" />
            </div>
            <p className="text-on-surface-variant text-sm font-label-caps uppercase tracking-wider font-semibold mb-2">Personal Best</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-on-surface">628.4</span>
              <span className="text-on-surface-variant text-sm font-medium">10m Air Rifle</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-tertiary text-sm font-medium">
              <TrendingUp size={16} />
              <span>+1.2 from last month</span>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden group hover:border-[#FF5252]/50 transition-colors shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame size={64} className="text-[#FF5252]" />
            </div>
            <p className="text-on-surface-variant text-sm font-label-caps uppercase tracking-wider font-semibold mb-2">Training Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-on-surface">12</span>
              <span className="text-on-surface-variant text-sm font-medium">Days</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[#FF5252] text-sm font-medium">
              <Flame size={16} />
              <span>Personal record!</span>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden group hover:border-[#FFB74D]/50 transition-colors shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target size={64} className="text-[#FFB74D]" />
            </div>
            <p className="text-on-surface-variant text-sm font-label-caps uppercase tracking-wider font-semibold mb-2">Total Shots</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-on-surface">12,450</span>
              <span className="text-on-surface-variant text-sm font-medium">This Year</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-on-surface-variant text-sm font-medium">
              <span>Goal: 20,000</span>
              <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-[#FFB74D] w-[62%] rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden group hover:border-[#42A5F5]/50 transition-colors shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award size={64} className="text-[#42A5F5]" />
            </div>
            <p className="text-on-surface-variant text-sm font-label-caps uppercase tracking-wider font-semibold mb-2">Range Rank</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-on-surface">#4</span>
              <span className="text-on-surface-variant text-sm font-medium">/ 142</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[#42A5F5] text-sm font-medium">
              <TrendingUp size={16} />
              <span>Up 2 spots this week</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed / Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-display font-bold text-on-surface">Recent Sessions</h2>
            
            <div className="space-y-4">
              {[
                { date: "Yesterday, 14:30", score: "624.1", shots: 60, title: "Afternoon Training", coach: "Coach Sarah" },
                { date: "Oct 12, 09:00", score: "618.5", shots: 60, title: "Morning Practice", coach: "Coach Sarah" },
                { date: "Oct 10, 16:00", score: "622.8", shots: 60, title: "Endurance Drill", coach: null },
              ].map((session, i) => (
                <div key={i} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-5 hover:bg-surface-container-high transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                      <span className="text-[10px] font-bold text-primary uppercase leading-none">SCORE</span>
                      <span className="text-lg font-bold text-primary leading-tight mt-0.5">{session.score}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">{session.title}</h3>
                      <p className="text-sm text-on-surface-variant">{session.date} • {session.shots} Shots {session.coach ? `• w/ ${session.coach}` : ''}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-outline group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
            
            <Button variant="ghost" className="w-full text-primary hover:bg-primary/10">
              View All Sessions
            </Button>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-on-surface">AI Insights</h2>
            
            <div className="bg-gradient-to-br from-surface-container-low to-surface-container border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                </div>
                <h3 className="font-bold text-on-surface">Performance Trend</h3>
              </div>
              
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                Your group radius has tightened by <strong>14%</strong> over the last 5 sessions. The AI detected that your hold stability improved significantly after the grip adjustment suggested by Coach Sarah.
              </p>
              
              <Button size="sm" className="w-full bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/30">
                View Full Analysis
              </Button>
            </div>

            <h2 className="text-2xl font-display font-bold text-on-surface mt-8">Recent Achievements</h2>
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                  <Award size={24} className="text-[#FFD700]" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Sharpshooter</h4>
                  <p className="text-xs text-on-surface-variant">Score &gt; 625 in 10m Air Rifle</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center shadow-[0_0_10px_rgba(var(--tertiary-rgb),0.3)]">
                  <TrendingUp size={24} className="text-tertiary" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Consistency King</h4>
                  <p className="text-xs text-on-surface-variant">5 sessions with std dev &lt; 0.5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
