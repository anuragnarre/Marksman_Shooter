"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Target, Maximize, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CoachLiveMonitoring() {
  return (
    <DashboardLayout role="COACH">
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#FF5252]/10 text-[#FF5252] text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-[#FF5252] rounded-full"></span> LIVE
              </span>
              <span className="text-xs font-bold text-on-surface-variant border border-outline-variant/30 px-2 py-0.5 rounded">
                Alpha Squad Session
              </span>
            </div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Live Monitoring</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high rounded-xl">
              <Maximize size={18} /> Fullscreen
            </Button>
            <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
              End Session
            </Button>
          </div>
        </div>

        {/* Live Lanes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            { id: 1, name: "David C.", lane: 1, lastShot: 10.6, series: 104.5, heartRate: 82, stability: 94 },
            { id: 2, name: "Sarah L.", lane: 2, lastShot: 9.8, series: 103.2, heartRate: 95, stability: 88, alert: true },
            { id: 3, name: "Michael T.", lane: 3, lastShot: 10.2, series: 102.8, heartRate: 78, stability: 91 },
            { id: 4, name: "Elena R.", lane: 4, lastShot: 10.8, series: 105.1, heartRate: 75, stability: 96 },
          ].map((athlete) => (
            <div key={athlete.id} className={`bg-surface-container-lowest border ${athlete.alert ? 'border-[#FFB300]' : 'border-outline-variant/50'} rounded-2xl overflow-hidden shadow-lg flex flex-col`}>
              <div className="bg-surface-container-high px-4 py-3 flex justify-between items-center border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    L{athlete.lane}
                  </div>
                  <span className="font-bold text-on-surface">{athlete.name}</span>
                </div>
                {athlete.alert && <AlertCircle size={16} className="text-[#FFB300] animate-pulse" />}
              </div>
              
              <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                <Target size={48} className="text-on-surface-variant mb-4 opacity-20 absolute" />
                <div className="relative z-10">
                  <p className="text-sm font-bold text-on-surface-variant uppercase mb-1">Last Shot</p>
                  <span className={`text-6xl font-display font-bold ${
                    athlete.lastShot >= 10.5 ? 'text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' :
                    athlete.lastShot < 10.0 ? 'text-[#FF5252]' : 'text-on-surface'
                  }`}>
                    {athlete.lastShot}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low border-t border-outline-variant/30 p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Series Total</p>
                  <p className="font-bold text-on-surface text-lg">{athlete.series}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase flex items-center gap-1">
                    <Activity size={10} className="text-[#FF5252]" /> HR / Stability
                  </p>
                  <p className="font-bold text-on-surface text-lg">{athlete.heartRate} <span className="text-xs text-on-surface-variant font-normal">bpm</span> / {athlete.stability}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
