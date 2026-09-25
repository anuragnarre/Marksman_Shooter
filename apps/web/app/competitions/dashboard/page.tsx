"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Trophy, Calendar, Users, Target, Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

const MOCK_COMPETITIONS = [
  { id: 1, name: "State Winter Championship 2026", type: "ISSF", date: "2026-12-15", status: "UPCOMING", registered: 145, capacity: 200 },
  { id: 2, name: "Monthly Club Match - October", type: "Club", date: "2026-10-05", status: "REGISTRATION_OPEN", registered: 42, capacity: 60 },
  { id: 3, name: "September Range Qualifications", type: "Internal", date: "2026-09-20", status: "COMPLETED", registered: 85, capacity: 85 },
];

export default function CompetitionsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Tournament Manager</h1>
            <p className="text-on-surface-variant text-lg mt-1">Organize and manage shooting competitions.</p>
          </div>
          <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Plus size={18} /> Create Competition
          </Button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="text-primary" size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Events</p>
              <h2 className="text-4xl font-display font-bold text-on-surface">2</h2>
            </div>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="text-secondary" size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Registrations</p>
              <h2 className="text-4xl font-display font-bold text-on-surface">187</h2>
            </div>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-tertiary/10 flex items-center justify-center">
              <Target className="text-tertiary" size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Lanes Reserved</p>
              <h2 className="text-4xl font-display font-bold text-on-surface">36</h2>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between pt-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <Input 
              placeholder="Search competitions..." 
              className="pl-10 h-12 bg-surface-container-low border-outline-variant/50 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high">
              <Filter size={18} className="mr-2" /> Filter
            </Button>
          </div>
        </div>

        {/* Competitions List */}
        <div className="space-y-4">
          {MOCK_COMPETITIONS.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((comp) => (
            <div key={comp.id} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-colors group flex flex-col md:flex-row justify-between md:items-center gap-6">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    comp.status === 'UPCOMING' ? 'bg-[#FFB300]/10 text-[#FFB300]' :
                    comp.status === 'REGISTRATION_OPEN' ? 'bg-primary/10 text-primary' :
                    'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {comp.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant border border-outline-variant/30 px-2 py-0.5 rounded">
                    {comp.type}
                  </span>
                </div>
                <h3 className="font-bold text-on-surface text-xl group-hover:text-primary transition-colors">{comp.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-on-surface-variant font-semibold">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {comp.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-8">
                <div className="text-center">
                  <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Registered</p>
                  <p className="text-2xl font-display font-bold text-on-surface">
                    {comp.registered} <span className="text-lg text-on-surface-variant">/ {comp.capacity}</span>
                  </p>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(comp.registered / comp.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href="/competitions/scoreboard">
                    <Button variant="outline" className="w-full justify-center border-primary/30 text-primary hover:bg-primary/10">
                      Live Scoreboard
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-center text-on-surface-variant hover:text-on-surface">
                    Manage <MoreHorizontal size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
              
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
