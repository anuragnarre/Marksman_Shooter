"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Users, Target, Activity, MessageCircle, AlertTriangle, TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MOCK_SQUADS = [
  { id: 1, name: "Alpha Squad (10m AR)", members: 12, avgScore: 624.5, nextSession: "Today, 14:00" },
  { id: 2, name: "Junior Development", members: 8, avgScore: 610.2, nextSession: "Tomorrow, 09:00" }
];

const MOCK_ALERTS = [
  { id: 1, type: "performance", message: "David C. dropped 5 points below baseline in last 2 sessions.", athlete: "David C.", severity: "high" },
  { id: 2, type: "health", message: "Sarah L. reported high fatigue level (8/10).", athlete: "Sarah L.", severity: "medium" },
  { id: 3, type: "goal", message: "Michael T. achieved his 625 target score!", athlete: "Michael T.", severity: "low" }
];

export default function CoachDashboard() {
  return (
    <DashboardLayout role="COACH">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Coach Dashboard</h1>
            <p className="text-on-surface-variant text-lg mt-1">Overview of your squads, athletes, and upcoming sessions.</p>
          </div>
          <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Activity size={18} /> Start Live Session
          </Button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Athletes</p>
              <h2 className="text-4xl font-display font-bold text-on-surface">24</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="text-primary" size={24} />
            </div>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Squads</p>
              <h2 className="text-4xl font-display font-bold text-on-surface">3</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Target className="text-secondary" size={24} />
            </div>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Upcoming Sessions</p>
              <h2 className="text-4xl font-display font-bold text-on-surface">5</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center">
              <Calendar className="text-tertiary" size={24} />
            </div>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Pending Feedback</p>
              <h2 className="text-4xl font-display font-bold text-on-surface">12</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FFB300]/10 flex items-center justify-center">
              <MessageCircle className="text-[#FFB300]" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Squad Overview & Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold text-on-surface">My Squads</h2>
              <Button variant="ghost" className="text-primary font-bold">View All</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {MOCK_SQUADS.map((squad) => (
                <div key={squad.id} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-on-surface">{squad.name}</h3>
                    <span className="bg-surface-container-highest px-2 py-1 rounded text-xs font-bold text-on-surface-variant">{squad.members} Athletes</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm mb-6">
                    <div>
                      <span className="text-on-surface-variant">Avg Score</span>
                      <p className="font-bold text-primary text-lg">{squad.avgScore}</p>
                    </div>
                    <div className="w-px h-8 bg-outline-variant/30"></div>
                    <div>
                      <span className="text-on-surface-variant">Next Session</span>
                      <p className="font-bold text-on-surface">{squad.nextSession}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-primary font-bold text-sm">
                    Manage Squad <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
              
              <div className="border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <span className="font-bold">Create New Squad</span>
              </div>
            </div>

            {/* Performance Insights */}
            <h2 className="text-2xl font-display font-bold text-on-surface mt-10">AI Performance Insights</h2>
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg">Overall Team Trend</h3>
                  <p className="text-on-surface-variant mt-1">
                    Alpha Squad's average score has increased by 1.2 points over the last 30 days. However, consistency in standing position needs attention across 4 athletes.
                  </p>
                  <Button variant="outline" className="mt-4 border-outline-variant/50">View Detailed Analytics</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Alerts & Tasks */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-on-surface flex items-center gap-2">
              <AlertTriangle className="text-[#FFB300]" size={24} /> Needs Attention
            </h2>
            
            <div className="space-y-4">
              {MOCK_ALERTS.map((alert) => (
                <div key={alert.id} className={`bg-surface-container-low border-l-4 rounded-xl p-4 shadow-sm ${
                  alert.severity === 'high' ? 'border-l-[#FF5252]' : 
                  alert.severity === 'medium' ? 'border-l-[#FFB300]' : 'border-l-secondary'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-on-surface">{alert.athlete}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      alert.severity === 'high' ? 'bg-[#FF5252]/10 text-[#FF5252]' : 
                      alert.severity === 'medium' ? 'bg-[#FFB300]/10 text-[#FFB300]' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-snug">{alert.message}</p>
                </div>
              ))}
            </div>
            
            <h2 className="text-2xl font-display font-bold text-on-surface mt-8 flex items-center gap-2">
              <Calendar className="text-primary" size={24} /> Today's Schedule
            </h2>
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex gap-3 items-center p-2 hover:bg-surface-container-highest rounded-lg transition-colors cursor-pointer">
                <div className="text-center font-bold text-on-surface min-w-[50px]">14:00</div>
                <div className="w-1 h-8 bg-primary rounded-full"></div>
                <div>
                  <p className="font-bold text-on-surface text-sm">Alpha Squad Practice</p>
                  <p className="text-xs text-on-surface-variant">Lanes 1-6</p>
                </div>
              </div>
              <div className="flex gap-3 items-center p-2 hover:bg-surface-container-highest rounded-lg transition-colors cursor-pointer">
                <div className="text-center font-bold text-on-surface min-w-[50px]">16:30</div>
                <div className="w-1 h-8 bg-secondary rounded-full"></div>
                <div>
                  <p className="font-bold text-on-surface text-sm">1-on-1 with David C.</p>
                  <p className="text-xs text-on-surface-variant">Lane 2</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}
