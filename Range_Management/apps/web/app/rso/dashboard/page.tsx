"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldAlert, Maximize, QrCode, Power, CheckCircle, AlertTriangle, Shield, Check, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

// Mobile-first RSO Dashboard
export default function RSODashboard() {
  const router = useRouter();
  const [rangeStatus, setRangeStatus] = useState<'HOT' | 'COLD'>('HOT');
  const [rangeId, setRangeId] = useState<string>('range-1');
  const [rangeName, setRangeName] = useState<string>('Range Alpha');
  const [showScanner, setShowScanner] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Unsafe Downrange Condition');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Fetch current active range
    async function loadRange() {
      try {
        const ranges = await apiFetch<any[]>('/ranges');
        if (ranges && ranges.length > 0) {
          setRangeId(ranges[0].id);
          setRangeName(ranges[0].name || 'Range Alpha');
          if (ranges[0].status === 'COLD' || ranges[0].status === 'CEASEFIRE') {
            setRangeStatus('COLD');
          }
        }
      } catch (err) {
        console.warn("Could not load range details, using default range-1", err);
      }
    }
    loadRange();

    // 2. Connect to WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3003';
    const socket = io(wsUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinRangeMonitor', rangeId);
    });

    socket.on('range_ceasefire', (data: any) => {
      setRangeStatus(data?.active ? 'COLD' : 'HOT');
      if (data?.active) {
        setBroadcastMessage(`Ceasefire active: ${data.reason || 'RSO Call'}`);
      } else {
        setBroadcastMessage('Range is Hot. Firing permitted.');
        setTimeout(() => setBroadcastMessage(null), 4000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [rangeId]);

  const handleToggleStatus = async () => {
    const nextStatus = rangeStatus === 'HOT' ? 'COLD' : 'HOT';
    const isCeasefire = nextStatus === 'COLD';
    setRangeStatus(nextStatus);

    try {
      // API call to update status
      await apiFetch(`/range-operations/${rangeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
    } catch {
      // Fallback
    }

    // Direct socket broadcast
    if (socketRef.current) {
      if (isCeasefire) {
        socketRef.current.emit('broadcastCeasefire', {
          rangeId,
          active: true,
          reason: 'Master RSO Switch Activated',
          initiatedBy: 'Range Safety Officer'
        });
      } else {
        socketRef.current.emit('clearCeasefire', {
          rangeId,
          active: false,
          initiatedBy: 'Range Safety Officer'
        });
      }
    }
  };

  const handleTriggerEmergencyCeasefire = async () => {
    setRangeStatus('COLD');
    setShowEmergencyModal(false);

    try {
      await apiFetch(`/range-operations/${rangeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COLD', reason: emergencyReason })
      });
    } catch {}

    if (socketRef.current) {
      socketRef.current.emit('broadcastCeasefire', {
        rangeId,
        active: true,
        reason: emergencyReason,
        initiatedBy: 'RSO Emergency Broadcast'
      });
    }
    setBroadcastMessage(`🚨 EMERGENCY CEASEFIRE BROADCAST: ${emergencyReason}`);
  };

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
        {broadcastMessage && (
          <div className="bg-primary/20 border border-primary text-on-surface px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
            <Radio className="text-primary animate-pulse" size={20} />
            <span className="font-bold text-sm">{broadcastMessage}</span>
          </div>
        )}
        
        {/* HUGE Range Status Toggle Button (COLD / HOT) */}
        <div className="flex flex-col items-center justify-center p-6 bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between w-full mb-3 px-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Master Range Switch</span>
            <span className="text-xs bg-surface-container-highest px-3 py-1 rounded-full font-mono text-primary font-bold">
              {rangeName}
            </span>
          </div>
          <button 
            onClick={handleToggleStatus}
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
              ? 'Warning: Range is HOT. Ceasefire is currently inactive.' 
              : 'Range is COLD. Ceasefire broadcast active across all shooter devices.'}
          </p>
        </div>

        {/* QR Scanner Action */}
        <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <QrCode className="text-primary" size={20} /> Shooter Gate Pass Check-in
           </h3>
           <Button 
             className="w-full bg-primary text-on-primary hover:bg-primary/90 rounded-2xl py-6 font-bold text-lg flex items-center justify-center gap-3"
             onClick={() => router.push('/checkin')}
           >
             <QrCode size={24} /> Open Express Gate Kiosk
           </Button>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
           <Button 
             variant="outline" 
             onClick={() => router.push('/lanes')}
             className="h-auto flex-col py-6 rounded-3xl border-outline-variant/50 hover:bg-surface-container-high bg-surface-container gap-3"
           >
             <div className="bg-tertiary/10 p-4 rounded-full">
               <CheckCircle size={28} className="text-tertiary" />
             </div>
             <span className="font-bold">Lane Inspections</span>
           </Button>
           <Button 
             variant="outline" 
             onClick={() => router.push('/safety')}
             className="h-auto flex-col py-6 rounded-3xl border-outline-variant/50 hover:bg-surface-container-high bg-surface-container gap-3"
           >
             <div className="bg-[#FF9800]/10 p-4 rounded-full">
               <AlertTriangle size={28} className="text-[#FF9800]" />
             </div>
             <span className="font-bold">Safety Log</span>
           </Button>
           <Button 
             variant="outline" 
             onClick={() => setShowEmergencyModal(true)}
             className="h-auto flex-col py-6 rounded-3xl border-[#FF5252]/40 hover:bg-[#FF5252]/10 bg-surface-container gap-3 col-span-2 text-[#FF5252]"
           >
             <div className="bg-[#FF5252]/10 p-4 rounded-full">
               <ShieldAlert size={28} className="text-[#FF5252]" />
             </div>
             <span className="font-bold uppercase tracking-wider text-base">🚨 BROADCAST EMERGENCY CEASEFIRE</span>
           </Button>
        </div>

        {/* Emergency Ceasefire Modal */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-high border-2 border-[#FF5252] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-[#FF5252]">
                <ShieldAlert size={32} />
                <div>
                  <h3 className="text-xl font-bold font-display uppercase tracking-wider">Confirm Emergency Ceasefire</h3>
                  <p className="text-xs text-on-surface-variant">Instant broadcast to all active lanes and shooters</p>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-on-surface-variant block mb-2">
                  Emergency Reason
                </label>
                <select 
                  value={emergencyReason} 
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl p-3 text-sm font-medium text-on-surface"
                >
                  <option value="Unsafe Downrange Condition">Unsafe Downrange Condition</option>
                  <option value="Medical Emergency on Firing Line">Medical Emergency on Firing Line</option>
                  <option value="Severe Firearm Malfunction / Hangfire">Severe Firearm Malfunction / Hangfire</option>
                  <option value="Unauthorized Personnel Downrange">Unauthorized Personnel Downrange</option>
                  <option value="Immediate RSO Inspection Required">Immediate RSO Inspection Required</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl"
                  onClick={() => setShowEmergencyModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-[2] rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold"
                  onClick={handleTriggerEmergencyCeasefire}
                >
                  Confirm & Broadcast
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
