"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { FileText, Download, Filter, Calendar, TrendingUp, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CoachReports() {
  return (
    <DashboardLayout role="COACH">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Reports & Analytics</h1>
            <p className="text-on-surface-variant text-lg mt-1">Generate comprehensive performance reports for your squads.</p>
          </div>
          <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Download size={18} /> Export Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Report Generator Form */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                <FileText className="text-primary" size={20} /> Generate Report
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Report Type</label>
                  <select className="w-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-semibold rounded-xl h-12 px-4 focus:border-primary focus:outline-none cursor-pointer">
                    <option>Squad Performance Summary</option>
                    <option>Individual Athlete Deep-Dive</option>
                    <option>Competition Readiness</option>
                    <option>Equipment Analytics</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Target</label>
                  <select className="w-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-semibold rounded-xl h-12 px-4 focus:border-primary focus:outline-none cursor-pointer">
                    <option>Alpha Squad</option>
                    <option>Junior Development</option>
                    <option>David C.</option>
                    <option>Sarah L.</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Date Range</label>
                  <select className="w-full bg-surface-container-highest border border-outline-variant/50 text-on-surface font-semibold rounded-xl h-12 px-4 focus:border-primary focus:outline-none cursor-pointer">
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>Year to Date</option>
                    <option>Custom Range</option>
                  </select>
                </div>

                <Button className="w-full mt-4 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl h-12">
                  Generate Report
                </Button>
              </div>
            </div>
          </div>

          {/* Report Preview / Recent Reports */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-display font-bold text-on-surface">Recent Reports</h2>
            
            <div className="space-y-4">
              {[
                { title: "Alpha Squad - August Summary", date: "Sep 1, 2026", type: "PDF" },
                { title: "David C. - State Pre-competition Analysis", date: "Aug 25, 2026", type: "PDF" },
                { title: "Junior Dev - Technique Progression", date: "Aug 15, 2026", type: "Excel" },
              ].map((report, idx) => (
                <div key={idx} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-primary/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.type === 'PDF' ? 'bg-[#FF5252]/10 text-[#FF5252]' : 'bg-[#4CAF50]/10 text-[#4CAF50]'}`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">{report.title}</h3>
                      <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Calendar size={12} /> Generated {report.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-on-surface-variant hover:text-on-surface">
                    <Download size={18} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-surface-container-low to-surface-container-lowest border border-outline-variant/50 rounded-2xl p-8 mt-8 text-center flex flex-col items-center justify-center">
              <BarChart2 size={48} className="text-tertiary opacity-50 mb-4" />
              <h3 className="text-xl font-bold text-on-surface">Advanced Analytics Available</h3>
              <p className="text-on-surface-variant max-w-md mt-2">
                Use the report generator to create custom views of biomechanical data, score trends, and equipment performance over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
