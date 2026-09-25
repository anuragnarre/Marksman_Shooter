"use client";

import React, { useState } from "react";
import { ShieldAlert, Maximize, QrCode, Power, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Mobile-first RSO Dashboard
export default function RSODashboard() {
  const [rangeStatus, setRangeStatus] = useState<'HOT' | 'COLD'>('HOT');
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="bg-surface-container-lowest min-h-screen text-on-surface font-sans flex flex-col">
      {/* Mobile-friendly Header */}
      <div className="bg-surface-container-high border-b border-outline-variant/30 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
           <Shield className="text-primary" size={24} />
           <div>
             <h1 className="text-lg font-bold leading-tight">RSO Panel</h1>
             <p className="text-xs text-on-surface-variant">Active Shift: Range A</p>
           </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0">
            <Maximize size={18} />
          </Button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-6">
        
        {/* HUGE Range Status Toggle Button (COLD / HOT) */}
        <div className="flex flex-col items-center justify-center p-6 bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">Master Range Status</p>
          <button 
            onClick={() => setRangeStatus(prev => prev === 'HOT' ? 'COLD' : 'HOT')}
            className={`w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300 transform active:scale-95 ${
              rangeStatus === 'HOT' 
                ? 'bg-gradient-to-br from-[#FF5252] to-[#D32F2F] shadow-[0_0_30px_rgba(255,82,82,0.6)] border-4 border-[#FF5252]/50' 
                : 'bg-gradient-to-br from-[#4CAF50] to-[#388E3C] shadow-[0_0_30px_rgba(76,175,80,0.6)] border-4 border-[#4CAF50]/50'
            }`}
          >
            <Power size={48} className="text-white mb-2 opacity-90" />
            <span className="text-white font-display font-bold text-4xl tracking-widest">{rangeStatus}</span>
          </button>
          <p className="mt-6 text-sm text-center text-on-surface-variant px-4">
            {rangeStatus === 'HOT' 
              ? 'Warning: Range is HOT. Hearing protection mandatory.' 
              : 'Range is COLD. Firearms must be grounded and safe.'}
          </p>
        </div>

        {/* QR Scanner Action */}
        <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <QrCode className="text-primary" size={20} /> Identity & Check-in
           </h3>
           {showScanner ? (
             <div className="bg-black rounded-2xl h-64 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 border-4 border-primary/50 m-8 rounded-xl border-dashed"></div>
               <p className="text-white/50 text-sm">Camera Feed Active</p>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="absolute bottom-4 bg-black/50 text-white border-white/20"
                 onClick={() => setShowScanner(false)}
               >
                 Cancel Scan
               </Button>
             </div>
           ) : (
             <Button 
               className="w-full bg-primary text-on-primary hover:bg-primary/90 rounded-2xl py-6 font-bold text-lg"
               onClick={() => setShowScanner(true)}
             >
               Scan Shooter QR Code
             </Button>
           )}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
           <Button variant="outline" className="h-auto flex-col py-6 rounded-3xl border-outline-variant/50 hover:bg-surface-container-high bg-surface-container gap-3">
             <div className="bg-tertiary/10 p-4 rounded-full">
               <CheckCircle size={28} className="text-tertiary" />
             </div>
             <span className="font-bold">Lane Inspections</span>
           </Button>
           <Button variant="outline" className="h-auto flex-col py-6 rounded-3xl border-outline-variant/50 hover:bg-surface-container-high bg-surface-container gap-3">
             <div className="bg-[#FF9800]/10 p-4 rounded-full">
               <AlertTriangle size={28} className="text-[#FF9800]" />
             </div>
             <span className="font-bold">Report Incident</span>
           </Button>
           <Button variant="outline" className="h-auto flex-col py-6 rounded-3xl border-outline-variant/50 hover:bg-surface-container-high bg-surface-container gap-3 col-span-2">
             <div className="bg-[#FF5252]/10 p-4 rounded-full">
               <ShieldAlert size={28} className="text-[#FF5252]" />
             </div>
             <span className="font-bold">Emergency Alert Broadcast</span>
           </Button>
        </div>

      </div>
    </div>
  );
}
