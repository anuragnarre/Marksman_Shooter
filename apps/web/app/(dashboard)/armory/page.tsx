"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Crosshair, Plus, AlertCircle, Wrench, Package } from "lucide-react";

export default function ArmoryPage() {
  return (
    <DashboardLayout role="SHOOTER">
      <div className="flex flex-col gap-8">
        
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Armory</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Manage your firearms, optics, and ammunition inventory.
            </p>
          </div>
          <Button variant="default" className="shrink-0 gap-2">
            <Plus size={16} /> Add Equipment
          </Button>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-display text-xl font-bold border-b border-[var(--border-subtle)] pb-2">
              Primary Firearms
            </h3>
            
            <GlassCard className="p-6 flex flex-col md:flex-row gap-6 border border-[var(--border-accent)]">
              <div className="h-24 w-24 md:h-32 md:w-32 bg-[var(--bg-void)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                <Crosshair size={40} className="text-[var(--text-muted)] opacity-50" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-xl font-bold text-white">Walther LG400</h4>
                    <p className="text-sm text-[var(--accent-primary)]">.177 Caliber (4.5mm)</p>
                  </div>
                  <span className="bg-[rgba(245,166,35,0.15)] text-[var(--accent-primary)] px-2 py-1 rounded text-xs font-bold uppercase">
                    Active
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Rounds Fired</p>
                    <p className="text-white font-data">14,250</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Serial No.</p>
                    <p className="text-white font-data">LG4-88219A</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Wrench size={14} /> Log Service
                  </Button>
                </div>
              </div>
            </GlassCard>

          </div>

          {/* Sidebar / Ammo Inventory */}
          <div className="space-y-6">
            <Card className="border-[var(--signal-red)]/50">
              <CardHeader className="pb-3 border-b border-[var(--border-subtle)] mb-3">
                <CardTitle className="text-[var(--signal-red)] flex items-center gap-2">
                  <AlertCircle size={20} /> Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--text-secondary)]">
                  Your <strong className="text-white">Pardini SP</strong> is due for a deep clean and spring replacement (2,500 rounds threshold reached).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} className="text-[var(--data-blue)]" />
                  Ammunition Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[var(--bg-void)] rounded-lg border border-[var(--border-subtle)]">
                  <div>
                    <p className="font-semibold text-white text-sm">RWS R10 Match</p>
                    <p className="text-xs text-[var(--text-muted)]">.177 / 8.2gr / Lot #A94B</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-data font-bold text-white">2,500</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Rounds</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--bg-void)] rounded-lg border border-[var(--border-subtle)]">
                  <div>
                    <p className="font-semibold text-white text-sm">Eley Tenex</p>
                    <p className="text-xs text-[var(--text-muted)]">.22LR / 40gr / Lot #33X</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-data font-bold text-[var(--warning)]">450</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Rounds</p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full text-xs" size="sm">
                  <Plus size={14} className="mr-1" /> Add Ammo Lot
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
