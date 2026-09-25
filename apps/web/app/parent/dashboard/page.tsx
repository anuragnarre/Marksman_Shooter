"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { User, Activity, FileText, ArrowUpRight, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";

// PARENT_GUARDIAN Dashboard
export default function ParentDashboard() {
  return (
    <DashboardLayout role="PARENT_GUARDIAN">
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-24 h-full overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Parent Portal</h1>
            <p className="text-on-surface-variant mt-2 text-lg">Monitor progress, view reports, and manage consents.</p>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-3 bg-surface-container-high py-2 px-4 rounded-xl border border-outline-variant/30">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                   <User className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase font-bold">Linked Athlete</p>
                  <p className="font-bold text-on-surface">Alex Junior</p>
                </div>
             </div>
          </div>
        </div>

        {/* Weekly Digest Highlight */}
        <div className="bg-gradient-to-br from-primary/10 to-tertiary/10 rounded-3xl p-8 border border-primary/20 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
             <FileText size={120} />
           </div>
           <div className="relative z-10 w-full md:w-2/3">
             <span className="inline-block bg-primary text-on-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
               Weekly Digest Available
             </span>
             <h2 className="text-3xl font-display font-bold text-on-surface mb-3">Week of Sep 18 - 24</h2>
             <p className="text-on-surface-variant text-lg mb-6 leading-relaxed">
               Alex completed 4 training sessions this week, totaling 240 shots. 
               Their average score in 10m Air Rifle improved by 1.2 points, setting a new Personal Best of 612.4.
             </p>
             <Button className="bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl px-6 py-5">
               Download PDF Report
             </Button>
           </div>
        </div>

        {/* Recent Activity & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Recent Sessions */}
           <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="text-primary" size={20} /> Recent Sessions
                </h3>
                <Button variant="link" className="text-primary font-bold">View All</Button>
              </div>
              
              <div className="space-y-4 flex-1">
                 {[
                   { date: "Yesterday, 4:00 PM", score: "612.4", pb: true },
                   { date: "Sep 22, 5:30 PM", score: "608.1", pb: false },
                   { date: "Sep 20, 4:00 PM", score: "610.5", pb: false },
                 ].map((session, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-surface-container-high rounded-2xl border border-outline-variant/20">
                      <div>
                        <p className="font-bold text-on-surface">10m Air Rifle Training</p>
                        <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                          <Clock size={14} /> {session.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-2xl text-on-surface">{session.score}</p>
                        {session.pb && (
                          <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded flex items-center justify-end gap-1 mt-1">
                            <Award size={10} /> NEW PB
                          </span>
                        )}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Consents & Action Items */}
           <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                <FileText className="text-tertiary" size={20} /> Action Items & Consents
              </h3>
              
              <div className="space-y-4 flex-1">
                 <div className="p-5 bg-[#FF9800]/10 border border-[#FF9800]/30 rounded-2xl flex flex-col gap-4">
                    <div>
                      <p className="font-bold text-[#FF9800] text-lg">Upcoming Competition</p>
                      <p className="text-on-surface-variant text-sm mt-1">State Winter Championship requires parental consent for minors.</p>
                    </div>
                    <Button className="w-full bg-[#FF9800] text-black hover:bg-[#FF9800]/90 font-bold">
                      Review & Sign Consent
                    </Button>
                 </div>

                 <div className="p-5 bg-surface-container-high border border-outline-variant/30 rounded-2xl flex justify-between items-center opacity-70">
                    <div>
                      <p className="font-bold text-on-surface">Annual Medical Release</p>
                      <p className="text-on-surface-variant text-sm mt-1">Signed on Jan 12, 2026</p>
                    </div>
                    <CheckCircleIcon />
                 </div>
              </div>
           </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

function CheckCircleIcon() {
  return <Award className="text-[#4CAF50]" />;
}
