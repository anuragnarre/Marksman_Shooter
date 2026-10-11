'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/auth-context';
import { QrCodeRenderer } from '@/components/QrCodeRenderer';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Radio, 
  Sparkles, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function ShooterPassPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [nfcState, setNfcState] = useState<'IDLE' | 'READING' | 'SUCCESS'>('IDLE');

  const shooterName = user?.name || 'Alex Mercer';
  const shooterEmail = user?.email || 'alex.mercer@marksman.dev';
  const shooterId = user?.id || 'usr-alex-9941';
  const shooterCode = shooterId.slice(0, 8).toUpperCase();

  // Cross-app standardized gate pass payload
  const passPayload = JSON.stringify({
    type: 'MARKSMAN_GATE_PASS',
    userId: shooterId,
    shooterCode,
    name: shooterName,
    email: shooterEmail,
    tier: 'PRO_COMPETITOR',
    waiverSigned: true,
    issuedAt: new Date().toISOString(),
    validUntil: '2026-12-31T23:59:59.000Z'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(passPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateNfc = () => {
    setNfcState('READING');
    setTimeout(() => {
      setNfcState('SUCCESS');
      setTimeout(() => setNfcState('IDLE'), 3500);
    }, 1200);
  };

  return (
    <DashboardLayout role="SHOOTER">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">DIGITAL ACCREDITATION</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Range Gate Pass</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Present this pass at any Marksman-affiliated physical range gate kiosk or turnstile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] transition-colors"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copied ? 'Payload Copied!' : 'Copy Gate Token'}</span>
            </button>
            <button
              onClick={handleSimulateNfc}
              disabled={nfcState !== 'IDLE'}
              className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[#e09418] text-black text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-glow"
            >
              <Radio size={16} className={nfcState === 'READING' ? 'animate-pulse' : ''} />
              <span>
                {nfcState === 'IDLE' && 'Simulate NFC Tap'}
                {nfcState === 'READING' && 'Reading Gate NFC...'}
                {nfcState === 'SUCCESS' && 'Gate Unlocked!'}
              </span>
            </button>
          </div>
        </div>

        {/* NFC Success Toast */}
        {nfcState === 'SUCCESS' && (
          <div className="bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 text-emerald-300">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <p className="font-bold text-sm text-white">NFC GATE BEACON CONFIRMED</p>
                <p className="text-xs text-emerald-200">Turnstile #02 Authorized. Lane assignment will be signaled downrange.</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-400/30 px-3 py-1 rounded-full font-mono font-bold text-white">
              ACCESS GRANTED
            </span>
          </div>
        )}

        {/* The VIP Pass Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12131A] via-[#1A1C28] to-[#0D0E14] border border-[var(--border-subtle)] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 sm:p-8">
          
          {/* Holographic Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--accent-primary)] via-emerald-400 to-[#0091FF]" />
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[var(--accent-primary)]/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Shooter Details */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] font-display font-black text-2xl shadow-inner">
                    M
                  </div>
                  <div>
                    <span className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">ORGANIZATION</span>
                    <h3 className="text-base font-bold text-white tracking-wide">MARKSMAN ATHLETICS FEDERATION</h3>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 text-xs font-mono font-bold">
                  ACTIVE MEMBER
                </span>
              </div>

              {/* Shooter Identity Section */}
              <div className="flex items-center gap-5 pt-2">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-stone-800 to-stone-700 border-2 border-[var(--accent-primary)] overflow-hidden shrink-0 shadow-lg flex items-center justify-center">
                  <span className="text-2xl font-display font-bold text-stone-200">
                    {shooterName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">{shooterName}</h2>
                  <p className="text-sm text-[var(--text-secondary)] font-mono">{shooterEmail}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="bg-white/10 text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                      PRO ATHLETE
                    </span>
                    <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
                      ID: {shooterCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Credentials Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[var(--bg-void)]/60 border border-[var(--border-subtle)] p-3 rounded-2xl">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">LIABILITY WAIVER</span>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-bold text-xs">
                    <ShieldCheck size={14} />
                    <span>SIGNED &amp; VERIFIED</span>
                  </div>
                </div>

                <div className="bg-[var(--bg-void)]/60 border border-[var(--border-subtle)] p-3 rounded-2xl">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">BILLING STATUS</span>
                  <div className="flex items-center gap-1.5 mt-1 text-white font-bold text-xs">
                    <CreditCard size={14} className="text-blue-400" />
                    <span>AUTO-RENEW ACTIVE</span>
                  </div>
                </div>

                <div className="bg-[var(--bg-void)]/60 border border-[var(--border-subtle)] p-3 rounded-2xl col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">PRIMARY DISCIPLINE</span>
                  <span className="text-xs font-bold text-white mt-1 block truncate">
                    10m Air Rifle (ISSF)
                  </span>
                </div>
              </div>

            </div>

            {/* QR Code Presentation Box */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl">
              <QrCodeRenderer 
                value={passPayload} 
                size={180} 
                fgColor="#12131A" 
                bgColor="#FFFFFF"
              />
              <div className="mt-3 text-center">
                <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase block font-semibold">
                  GATE AUTO-SCANNER READY
                </span>
                <span className="text-xs font-mono font-bold text-stone-800 tracking-wider">
                  {shooterCode}
                </span>
              </div>
            </div>

          </div>

          {/* Barcode Footer Strip */}
          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
              <Sparkles size={14} className="text-[var(--accent-primary)]" />
              <span>Compatible with Megalink, Sius Ascor &amp; Marksman AI turnstiles.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-32 bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,#000_2px,#000_5px)] opacity-60 rounded" />
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{shooterCode}-PASS</span>
            </div>
          </div>

        </div>

        {/* Helpful Tips Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-[var(--accent-primary)] shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-[var(--text-secondary)]">
            <h4 className="text-white font-bold">Fast-Lane Express Gate Instructions</h4>
            <p>
              Hold your screen within 10cm of the kiosk optical scanner or touch the NFC reader at the entrance turnstile.
              Once scanned, your assigned lane will light up downrange and the door will unlock automatically.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
