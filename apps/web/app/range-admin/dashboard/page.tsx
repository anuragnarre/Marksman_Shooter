"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Users, Crosshair, TrendingUp, AlertTriangle, Settings, Calendar, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RangeAdminDashboard() {
  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 h-full overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Range Admin Dashboard</h1>
            <p className="text-on-surface-variant mt-2 text-lg">Overview of facility operations, revenue, and active shooters.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl font-bold">
              <Settings size={18} className="mr-2" /> Settings
            </Button>
            <Button className="bg-primary text-on-primary hover:bg-primary/90 shadow-md rounded-xl font-bold">
              <AlertTriangle size={18} className="mr-2" /> Broadcast Alert
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Users size={24} className="text-primary" />
              </div>
              <span className="text-xs font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-1 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +12%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Members</p>
              <p className="text-4xl font-display font-bold text-on-surface">1,248</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-tertiary/10 p-3 rounded-2xl">
                <Crosshair size={24} className="text-tertiary" />
              </div>
              <span className="text-xs font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-1 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +5%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Lanes Occupied</p>
              <p className="text-4xl font-display font-bold text-on-surface">18 / 24</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#FF9800]/10 p-3 rounded-2xl">
                <DollarSign size={24} className="text-[#FF9800]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Today's Revenue</p>
              <p className="text-4xl font-display font-bold text-on-surface">$4,520</p>
            </div>
          </div>
          <div className="bg-[#FF5252]/10 rounded-3xl p-6 border border-[#FF5252]/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#FF5252]/20 p-3 rounded-2xl animate-pulse">
                <Activity size={24} className="text-[#FF5252]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#FF5252] uppercase tracking-wider mb-1">Active Incidents</p>
              <p className="text-4xl font-display font-bold text-[#FF5252]">0</p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
             <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
               <Calendar size={20} className="text-primary" /> Today's Schedule
             </h3>
             <div className="space-y-4">
               {[
                 { time: "09:00 AM", event: "State Qualifiers - 10m Air Rifle", lanes: "1-10", type: "COMPETITION" },
                 { time: "11:00 AM", event: "Beginner Safety Course", lanes: "15-20", type: "COURSE" },
                 { time: "02:00 PM", event: "Elite Squad Training", lanes: "5-10", type: "TRAINING" },
               ].map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-4 bg-surface-container-high rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                   <div className="flex items-center gap-4">
                     <span className="font-bold text-on-surface-variant w-20">{item.time}</span>
                     <div className="h-8 w-1 bg-primary/30 rounded-full"></div>
                     <div>
                       <p className="font-bold text-on-surface text-lg">{item.event}</p>
                       <p className="text-sm text-on-surface-variant">Lanes {item.lanes}</p>
                     </div>
                   </div>
                   <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                     item.type === 'COMPETITION' ? 'bg-[#FF9800]/10 text-[#FF9800]' :
                     item.type === 'COURSE' ? 'bg-tertiary/10 text-tertiary' :
                     'bg-primary/10 text-primary'
                   }`}>
                     {item.type}
                   </span>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col">
             <h3 className="text-xl font-bold text-on-surface mb-6">Quick Actions</h3>
             <div className="space-y-3 flex-1">
                <Link href="/lanes/management">
                  <Button variant="outline" className="w-full justify-start py-6 text-lg font-semibold rounded-2xl border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5 mb-3">
                    Lane Management
                  </Button>
                </Link>
                <Link href="/staff/roster">
                  <Button variant="outline" className="w-full justify-start py-6 text-lg font-semibold rounded-2xl border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5 mb-3">
                    Staff Roster
                  </Button>
                </Link>
                <Link href="/memberships/overview">
                  <Button variant="outline" className="w-full justify-start py-6 text-lg font-semibold rounded-2xl border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5 mb-3">
                    Membership Billing
                  </Button>
                </Link>
                <Link href="/safety/reports">
                  <Button variant="outline" className="w-full justify-start py-6 text-lg font-semibold rounded-2xl border-outline-variant/50 hover:border-[#FF5252]/50 hover:bg-[#FF5252]/5">
                    Incident Reports
                  </Button>
                </Link>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
