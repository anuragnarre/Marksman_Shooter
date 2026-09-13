"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertTriangle, FileText, CheckCircle, ShieldAlert, Camera, Search, BookOpen, Shield, ShieldCheck, ChevronRight, UploadCloud, X } from "lucide-react";

export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState<"INCIDENTS" | "RULES">("INCIDENTS");
  const [isReporting, setIsReporting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const incidents = [
    { id: "INC-2026-089", date: "2026-09-11 14:30", type: "Target Malfunction", severity: "MINOR", lane: 7, status: "OPEN", reporter: "RSO Davis" },
    { id: "INC-2026-088", date: "2026-09-10 09:15", type: "Safety Violation (Muzzle)", severity: "SERIOUS", lane: 2, status: "CLOSED", reporter: "RSO Smith" },
    { id: "INC-2026-087", date: "2026-09-08 16:45", type: "Medical - Minor Burn", severity: "MODERATE", lane: 12, status: "CLOSED", reporter: "RSO Davis" },
  ];

  const rules = [
    { id: "R-1", title: "Always keep firearms pointed in a safe direction.", category: "Core Safety", active: true },
    { id: "R-2", title: "Keep finger off the trigger until ready to shoot.", category: "Core Safety", active: true },
    { id: "R-3", title: "Eye and ear protection mandatory on the firing line.", category: "Range Rules", active: true },
    { id: "R-4", title: "No rapid fire without prior RSO authorization.", category: "Range Rules", active: true },
    { id: "R-5", title: "All casing pickup only after range is declared cold.", category: "Procedures", active: false },
  ];

  const simulatePhotoUpload = () => {
    setUploadedPhotos([...uploadedPhotos, `https://picsum.photos/seed/${Math.random()}/200/200`]);
  };

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="flex flex-col h-full gap-8 relative">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Safety & Compliance</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage incident reports, track corrective actions, and configure range rules.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {activeTab === "INCIDENTS" && (
              <Button 
                variant="danger" 
                className="shrink-0 gap-2 font-bold shadow-[0_0_20px_rgba(255,77,109,0.3)] hover:shadow-[0_0_30px_rgba(255,77,109,0.5)]"
                onClick={() => setIsReporting(true)}
              >
                <AlertTriangle size={16} /> Report Incident
              </Button>
            )}
            {activeTab === "RULES" && (
              <Button variant="default" className="shrink-0 gap-2 bg-[var(--accent-primary)] hover:bg-[#c98e21] text-black font-semibold">
                + Add New Rule
              </Button>
            )}
          </div>
        </section>

        {/* Custom Tabs */}
        <div className="flex gap-2 p-1 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-xl w-fit shrink-0">
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "INCIDENTS" ? "bg-[var(--bg-panel)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            onClick={() => setActiveTab("INCIDENTS")}
          >
            <ShieldAlert size={16} /> Incident Logs
          </button>
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "RULES" ? "bg-[var(--bg-panel)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            onClick={() => setActiveTab("RULES")}
          >
            <BookOpen size={16} /> Rule Configuration
          </button>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-6">
            
            {activeTab === "INCIDENTS" ? (
              <Card className="border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xl">
                <CardHeader className="border-b border-[var(--border-subtle)] pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText size={20} className="text-[var(--data-blue)]" /> Incident Register
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
                    <Input placeholder="Search reports..." className="pl-9 h-9 bg-[var(--bg-void)] text-sm" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider bg-[var(--bg-void)] border-b border-[var(--border-subtle)]">
                        <tr>
                          <th className="px-5 py-3">Incident ID</th>
                          <th className="px-5 py-3">Type & Severity</th>
                          <th className="px-5 py-3">Location</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {incidents.map((inc) => (
                          <tr key={inc.id} className="hover:bg-[var(--bg-void)]/50 transition-colors group">
                            <td className="px-5 py-4">
                              <span className="font-mono text-white">{inc.id}</span>
                              <div className="text-xs text-[var(--text-secondary)] mt-1">{inc.date}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-semibold text-white">{inc.type}</span>
                              <div className="mt-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  inc.severity === 'MINOR' ? 'bg-[var(--data-blue)]/10 text-[var(--data-blue)] border-[var(--data-blue)]/20' : 
                                  inc.severity === 'MODERATE' ? 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20' : 
                                  'bg-[var(--signal-red)]/10 text-[var(--signal-red)] border-[var(--signal-red)]/20'
                                }`}>
                                  {inc.severity}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[var(--text-secondary)]">Lane {inc.lane}</td>
                            <td className="px-5 py-4">
                              <span className={`flex items-center gap-1.5 text-xs font-bold ${
                                inc.status === 'OPEN' ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'
                              }`}>
                                {inc.status === 'OPEN' && <span className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" />}
                                {inc.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Button variant="ghost" size="sm" className="text-[var(--data-blue)] opacity-0 group-hover:opacity-100 transition-opacity">
                                View Report <ChevronRight size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xl">
                <CardHeader className="border-b border-[var(--border-subtle)] pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[var(--emerald-signal)]" /> Standard Operating Procedures (SOPs)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                      rule.active ? "bg-[var(--bg-void)] border-[var(--border-subtle)]" : "bg-[var(--bg-void)]/30 border-transparent opacity-60"
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-white text-base">{rule.title}</h4>
                          {!rule.active && <span className="px-2 py-0.5 rounded bg-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-secondary)] uppercase">Disabled</span>}
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] font-mono">{rule.id} • {rule.category}</span>
                      </div>
                      <div className="shrink-0 ml-4 flex gap-2">
                        <Button variant="outline" size="sm" className="h-8">Edit</Button>
                        <Button variant={rule.active ? "outline" : "default"} size="sm" className="h-8">
                          {rule.active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6 border-t-4 border-t-[var(--signal-red)]">
              <h3 className="text-sm uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert size={16} className="text-[var(--signal-red)]" /> High Priority
              </h3>
              <div className="p-4 bg-[rgba(255,77,109,0.05)] border border-[rgba(255,77,109,0.2)] rounded-lg">
                <p className="font-bold text-white text-sm mb-1">Action Required: INC-2026-089</p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Target retrieval system on Lane 7 requires maintenance review before lane can be marked AVAILABLE.</p>
                <Button size="sm" variant="danger" className="w-full text-xs">Review & Close</Button>
              </div>
            </GlassCard>

            <Card className="border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xl">
              <CardHeader className="border-b border-[var(--border-subtle)] pb-4">
                <CardTitle className="text-lg">Compliance Checks</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-[var(--bg-void)] border-[var(--border-subtle)]">
                  <CheckCircle size={18} className="text-[var(--emerald-signal)]" /> Audit Log
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-[var(--bg-void)] border-[var(--border-subtle)]">
                  <FileText size={18} className="text-[var(--text-muted)]" /> Export OSHA Report
                </Button>
              </CardContent>
            </Card>
          </div>

        </section>

        {/* Reporting Modal Overlay */}
        {isReporting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
            <Card className="w-full max-w-2xl border border-[var(--signal-red)]/30 bg-[var(--bg-panel)] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setIsReporting(false)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
              >
                <X size={20} />
              </button>
              
              <CardHeader className="border-b border-[var(--border-subtle)] bg-[rgba(255,77,109,0.02)]">
                <CardTitle className="flex items-center gap-2 text-[var(--signal-red)]">
                  <AlertTriangle size={20} /> New Incident Report
                </CardTitle>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Submit a detailed report for any safety violation, malfunction, or medical event.</p>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Incident Type</label>
                    <select className="w-full h-10 px-3 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg text-white text-sm focus:border-[var(--accent-primary)] focus:outline-none">
                      <option>Safety Violation</option>
                      <option>Equipment Malfunction</option>
                      <option>Medical Emergency</option>
                      <option>Property Damage</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Location / Lane</label>
                    <Input placeholder="e.g., Lane 4" className="bg-[var(--bg-void)] h-10 text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Description of Event</label>
                  <textarea 
                    className="w-full h-24 p-3 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg text-white text-sm focus:border-[var(--accent-primary)] focus:outline-none resize-none"
                    placeholder="Provide a detailed, objective account of what happened..."
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                    <span>Evidence / Photos</span>
                    <span className="text-[var(--text-muted)] font-normal">{uploadedPhotos.length}/4 Uploaded</span>
                  </label>
                  
                  <div className="flex gap-4">
                    {uploadedPhotos.map((url, i) => (
                      <div key={i} className="w-20 h-20 rounded-lg bg-[var(--bg-void)] border border-[var(--border-subtle)] overflow-hidden">
                        <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {uploadedPhotos.length < 4 && (
                      <button 
                        onClick={simulatePhotoUpload}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-primary)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors bg-[var(--bg-void)]/50"
                      >
                        <Camera size={20} />
                        <span className="text-[10px] font-bold">Add</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="outline" onClick={() => setIsReporting(false)}>Cancel</Button>
                  <Button variant="danger" className="gap-2" onClick={() => setIsReporting(false)}>
                    <UploadCloud size={16} /> Submit Official Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
