"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { History, Search, Filter, ChevronRight, Calendar as CalendarIcon, Clock, Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const MOCK_SESSIONS = [
  { id: 1, date: "2026-09-23", time: "14:30", title: "Afternoon Training", score: 624.1, shots: 60, discipline: "10m Air Rifle", coach: "Coach Sarah" },
  { id: 2, date: "2026-09-21", time: "09:00", title: "Morning Practice", score: 618.5, shots: 60, discipline: "10m Air Rifle", coach: "Coach Sarah" },
  { id: 3, date: "2026-09-18", time: "16:00", title: "Endurance Drill", score: 622.8, shots: 120, discipline: "10m Air Rifle", coach: null },
  { id: 4, date: "2026-09-15", time: "10:00", title: "Competition Prep", score: 628.4, shots: 60, discipline: "10m Air Rifle", coach: "Coach Sarah", isPB: true },
  { id: 5, date: "2026-09-12", time: "15:30", title: "Free Practice", score: 612.0, shots: 40, discipline: "10m Air Rifle", coach: null },
  { id: 6, date: "2026-09-10", time: "11:00", title: "Technique Focus", score: 619.5, shots: 60, discipline: "10m Air Rifle", coach: "Coach Sarah" },
];

export default function ShooterSessions() {
  const [searchTerm, setSearchTerm] = useState("");
  
  return (
    <DashboardLayout role="SHOOTER">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Sessions & History</h1>
            <p className="text-on-surface-variant text-lg mt-1">Review your past performance and AI feedback.</p>
          </div>
          <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Plus size={18} /> Log Offline Session
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <Input 
              placeholder="Search sessions..." 
              className="pl-10 h-12 bg-surface-container-low border-outline-variant/50 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high">
              <CalendarIcon size={18} className="mr-2" /> Date Range
            </Button>
            <Button variant="outline" className="h-12 border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high">
              <Filter size={18} className="mr-2" /> Filter
            </Button>
          </div>
        </div>

        {/* Session Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SESSIONS.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map((session) => (
            <div key={session.id} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col justify-between shadow-sm relative overflow-hidden">
              
              {session.isPB && (
                <div className="absolute -right-8 top-4 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider py-1 px-8 rotate-45 shadow-md">
                  Personal Best
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-highest flex flex-col items-center justify-center border border-outline-variant/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase leading-none">SCORE</span>
                    <span className={`text-xl font-bold leading-tight mt-1 ${session.isPB ? 'text-primary' : 'text-on-surface'}`}>{session.score}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-on-surface">{session.date}</p>
                    <p className="text-xs text-on-surface-variant flex items-center justify-end gap-1 mt-1">
                      <Clock size={12} /> {session.time}
                    </p>
                  </div>
                </div>
                
                <h3 className="font-bold text-on-surface text-lg mb-1">{session.title}</h3>
                <p className="text-sm text-on-surface-variant flex items-center gap-1">
                  <Target size={14} /> {session.discipline} • {session.shots} Shots
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="text-xs font-semibold text-tertiary bg-tertiary/10 px-2 py-1 rounded-md">
                  {session.coach ? `Coach: ${session.coach.split(' ')[1]}` : 'Self-guided'}
                </span>
                
                <div className="w-8 h-8 rounded-full bg-surface-container-highest group-hover:bg-primary group-hover:text-on-primary text-on-surface-variant flex items-center justify-center transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State Fallback (Not shown unless search is empty) */}
        {MOCK_SESSIONS.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
          <div className="p-12 border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center text-center">
            <History size={48} className="text-on-surface-variant mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-on-surface">No sessions found</h3>
            <p className="text-on-surface-variant mt-2 max-w-md">Try adjusting your search filters or clear the search term to see your history.</p>
            <Button variant="outline" className="mt-6 border-outline-variant/50" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </div>
        )}
        
      </div>
    </DashboardLayout>
  );
}
