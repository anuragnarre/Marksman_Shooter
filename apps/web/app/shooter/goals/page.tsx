"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Target, Flag, Flame, Calendar as CalendarIcon, CheckCircle2, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MOCK_GOALS = [
  { id: 1, title: "Break 630.0 in 10m Air Rifle", targetScore: 630.0, currentAvg: 627.5, baseline: 624.0, deadline: "2026-11-01", status: "ACTIVE" },
  { id: 2, title: "Achieve Consistency < 0.3 Std Dev", targetScore: 0.3, currentAvg: 0.42, baseline: 0.65, deadline: "2026-10-15", status: "ACTIVE" },
  { id: 3, title: "Reach Top 3 on Range Leaderboard", targetScore: 3, currentAvg: 4, baseline: 8, deadline: "2026-12-31", status: "ACTIVE" }
];

export default function ShooterGoals() {
  return (
    <DashboardLayout role="SHOOTER">
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Goals & Streaks</h1>
            <p className="text-on-surface-variant text-lg mt-1">Track your progress and stay consistent.</p>
          </div>
          <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Plus size={18} /> Set New Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content: Goals */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-display font-bold text-on-surface flex items-center gap-2">
              <Target className="text-primary" size={24} /> Active Goals
            </h2>
            
            <div className="space-y-4">
              {MOCK_GOALS.map((goal) => {
                const progress = Math.min(100, Math.max(0, ((goal.currentAvg - goal.baseline) / (goal.targetScore - goal.baseline)) * 100));
                
                return (
                  <div key={goal.id} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm group hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-on-surface text-lg">{goal.title}</h3>
                        <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                          <CalendarIcon size={14} /> Target Date: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {goal.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-on-surface-variant">Baseline: {goal.baseline}</span>
                        <span className="text-primary">Current: {goal.currentAvg}</span>
                        <span className="text-on-surface-variant">Target: {goal.targetScore}</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full relative"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-xs text-right text-tertiary font-bold mt-1">
                        {Math.round(progress)}% Complete
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <h2 className="text-2xl font-display font-bold text-on-surface flex items-center gap-2 mt-12">
              <CheckCircle2 className="text-secondary" size={24} /> Completed Goals
            </h2>
            
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm opacity-70">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-on-surface line-through decoration-on-surface-variant/50">Qualify for State Championships</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Achieved on Aug 15, 2026</p>
                </div>
                <TrophyIcon className="text-[#FFD700]" size={32} />
              </div>
            </div>
          </div>

          {/* Sidebar: Streak */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-on-surface flex items-center gap-2">
              <Flame className="text-[#FF5252]" size={24} /> Training Streak
            </h2>
            
            <div className="bg-gradient-to-b from-[#FF5252]/10 to-surface-container-low border border-[#FF5252]/30 rounded-2xl p-6 text-center relative overflow-hidden">
              <Flame className="absolute -top-10 -right-10 text-[#FF5252]/5" size={150} />
              
              <div className="relative z-10">
                <span className="text-6xl font-display font-bold text-[#FF5252] drop-shadow-[0_0_15px_rgba(255,82,82,0.4)]">12</span>
                <p className="text-lg font-bold text-on-surface mt-2 uppercase tracking-wider">Day Streak</p>
                <p className="text-sm text-on-surface-variant mt-2">
                  You've trained every day since Sep 13! Keep it going to break your record of 15 days.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-7 gap-2 relative z-10">
                {['M','T','W','T','F','S','S'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant">{day}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i < 4 ? 'bg-[#FF5252] shadow-[0_0_10px_rgba(255,82,82,0.4)]' : 'bg-surface-container-highest'}`}>
                      {i < 4 ? <CheckCircle2 size={16} className="text-black" /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 mt-6">
               <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4 mb-4">
                  <TrendingUp className="text-tertiary" size={20} />
                  <h3 className="font-bold text-on-surface">Consistency Score</h3>
               </div>
               <div className="flex items-end justify-center gap-2">
                 <span className="text-5xl font-display font-bold text-on-surface">92</span>
                 <span className="text-on-surface-variant font-bold pb-1">/ 100</span>
               </div>
               <p className="text-xs text-center text-on-surface-variant mt-2">
                 Based on session frequency and std dev.
               </p>
            </div>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
