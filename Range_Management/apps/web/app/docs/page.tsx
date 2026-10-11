// apps/web/app/docs/page.tsx
'use client';

import { useState, useMemo, Suspense } from 'react';
import { AppShell } from '../../components/AppShell';

// ── Section Registry ─────────────────────────────────────────────────────────

type SectionId = 'sop' | 'compliance' | 'emergency' | 'console' | 'hardware' | 'rubric';

interface SectionMeta {
  id: SectionId;
  label: string;
  badge: string;
  icon: string;
  desc: string;
}

const SECTIONS: SectionMeta[] = [
  {
    id: 'sop',
    label: 'RSO Standard Operating Procedures',
    badge: 'Line Command',
    icon: '🛡️',
    desc: 'Firing line verbal commands, opening/closing checklists, and firearm malfunction protocols.',
  },
  {
    id: 'compliance',
    label: 'OSHA, EPA & Statutory Regulations',
    badge: 'Legal & Safety',
    icon: '⚖️',
    desc: 'OSHA lead air velocity standards, NRR acoustic mandates, ATF armory custody, and EPA rules.',
  },
  {
    id: 'emergency',
    label: 'Emergency Trauma & Medical Response',
    badge: 'Life Safety',
    icon: '🚨',
    desc: 'TCCC MARCH protocol for traumatic wounds, windlass tourniquet placement, and 911 dispatch scripts.',
  },
  {
    id: 'console',
    label: 'Software Operations Console',
    badge: 'Operator UI',
    icon: '💻',
    desc: 'Managing live lanes, triggering WebSocket cease-fires, turnstile QR gate checks, and booking matrices.',
  },
  {
    id: 'hardware',
    label: 'Hardware & Target Camera Rig',
    badge: 'Downrange Tech',
    icon: '🎯',
    desc: 'AR500 ballistic deflector armor placement, DC flicker-free LED lighting, and vision calibration.',
  },
  {
    id: 'rubric',
    label: 'RSO Certification & Checklist',
    badge: 'Verification',
    icon: '📋',
    desc: 'Interactive pre-opening range inspection checklist and 100-point staff certification rubric.',
  },
];

// ── Callout Components ───────────────────────────────────────────────────────

function AlertBox({
  type,
  title,
  children,
}: {
  type: 'danger' | 'warning' | 'info' | 'success';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    danger: {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#EF4444',
      badge: 'CRITICAL SAFETY MANDATE',
    },
    warning: {
      bg: 'rgba(245, 166, 35, 0.08)',
      border: 'rgba(245, 166, 35, 0.3)',
      text: '#F5A623',
      badge: 'STANDARD OPERATING PROTOCOL',
    },
    info: {
      bg: 'rgba(56, 189, 248, 0.08)',
      border: 'rgba(56, 189, 248, 0.25)',
      text: '#38BDF8',
      badge: 'REGULATORY GUIDANCE',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#10B981',
      badge: 'VERIFIED BEST PRACTICE',
    },
  }[type];

  return (
    <div
      className="p-4 rounded-xl border my-4 space-y-2"
      style={{ backgroundColor: styles.bg, borderColor: styles.border }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: `${styles.text}20`, color: styles.text }}
        >
          {styles.badge}
        </span>
        {title && <h4 className="font-display font-semibold text-sm text-text-primary">{title}</h4>}
      </div>
      <div className="text-text-secondary text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// ── Main Page Content ────────────────────────────────────────────────────────

function OperatorManualInner() {
  const [activeSection, setActiveSection] = useState<SectionId>('sop');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Checklist State
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    baffles: true,
    ventilation: true,
    targetCam: false,
    ceasefireRelay: false,
    ifakSeals: true,
    waiversEnforced: false,
  });

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistCompletion = useMemo(() => {
    const keys = Object.keys(checklist);
    const completed = keys.filter((k) => checklist[k]).length;
    return Math.round((completed / keys.length) * 100);
  }, [checklist]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#121824] via-[#0F172A] to-[#0A0E17] border border-border-subtle relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] text-xs font-mono font-bold tracking-wider uppercase">
              OFFICIAL OPERATING MANUAL
            </span>
            <span className="px-2.5 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-mono font-bold tracking-wider uppercase">
              OSHA • ATF • ISSF CERTIFIED
            </span>
            <span className="text-text-muted text-xs font-mono">DOC-RSO-2026-V1</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-display font-extrabold text-white tracking-tight">
            Marksman Tactical Ecosystem — Range Operator & RSO Manual
          </h1>
          <p className="text-text-secondary text-sm md:text-base max-w-3xl leading-relaxed">
            Standard Operating Procedures (SOP), statutory compliance guidelines, life-safety medical protocols, and console operations manual for physical shooting range command and Range Safety Officers.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-text-muted font-mono">
            <div><span className="text-text-secondary">Ventilation Req:</span> 50–75 fpm laminar</div>
            <div><span className="text-text-secondary">Hearing Protection:</span> NRR 28+ required</div>
            <div><span className="text-text-secondary">Console Port:</span> localhost:3002 (API :3003)</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`p-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between relative group ${
                isActive
                  ? 'bg-[#1E293B] border-[#F5A623] shadow-lg shadow-[#F5A623]/10 ring-1 ring-[#F5A623]/50'
                  : 'bg-[#0F172A]/80 border-border-subtle/80 hover:bg-[#1E293B]/60 hover:border-border-subtle'
              }`}
            >
              <div>
                <div className="text-2xl mb-2">{sec.icon}</div>
                <div className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase mb-1">
                  {sec.badge}
                </div>
                <div className={`font-display font-bold text-sm leading-snug ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                  {sec.label}
                </div>
              </div>
              {isActive && (
                <div className="w-full h-1 bg-[#F5A623] rounded-full mt-3 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Panel */}
      <div className="bg-[#0B0F19] border border-border-subtle rounded-2xl p-6 md:p-10 shadow-xl">
        {/* SECTION 1: RSO STANDARD OPERATING PROCEDURES */}
        {activeSection === 'sop' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <span className="text-[#F5A623] font-mono text-xs font-bold uppercase tracking-wider">SECTION 1.0</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">
                Firing Line Command Protocol & Standard Operating Procedures
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                The Range Safety Officer (RSO) exercises immediate, non-negotiable authority over the firing line. Commands must be delivered loudly, assertively, and strictly adhere to standardized phrasing.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                Universal Firing Line Verbal Script
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0F172A] border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
                      COMMAND: COMMENCE
                    </span>
                    <span className="text-xs text-text-muted">Line Hot</span>
                  </div>
                  <p className="text-white font-mono text-sm font-semibold">
                    "THE RANGE IS ACTIVE. YOU MAY COMMENCE FIRING."
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    Shooters may uncase firearms on the bench, load magazines, chamber rounds, and engage assigned targets downrange. Muzzles must strictly remain oriented downrange at all times.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0F172A] border border-[#EF4444]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded">
                      COMMAND: EMERGENCY CEASE-FIRE
                    </span>
                    <span className="text-xs text-[#EF4444] font-bold">ANYONE CAN CALL THIS</span>
                  </div>
                  <p className="text-white font-mono text-sm font-semibold">
                    "CEASE FIRING! CEASE FIRING! CEASE FIRING!"
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    Immediate non-negotiable stop. All fingers off triggers, weapons benched with muzzle downrange, actions locked open, and shooters immediately step 2 paces behind the yellow safety line.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0F172A] border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded">
                      COMMAND: UNLOAD & SHOW CLEAR
                    </span>
                    <span className="text-xs text-text-muted">Safe Gun Check</span>
                  </div>
                  <p className="text-white font-mono text-sm font-semibold">
                    "UNLOAD AND SHOW CLEAR."
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    Remove magazine, cycle slide to extract round, lock slide or bolt open, visually inspect chamber, insert empty chamber indicator (ECI / chamber flag), and wait for RSO physical inspection.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0F172A] border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-text-muted bg-white/5 px-2 py-0.5 rounded">
                      COMMAND: LINE COLD
                    </span>
                    <span className="text-xs text-text-muted">Target Maintenance</span>
                  </div>
                  <p className="text-white font-mono text-sm font-semibold">
                    "THE RANGE IS COLD. STEP BACK FROM THE FIRING BENCH."
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    No individual may touch any firearm, magazine, or ammunition while the line is cold. Downrange target inspection or brass clearing forward of the line may proceed only on RSO clearance.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-6 space-y-4">
              <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                Weapon Stoppage & Malfunction Clearance Protocols
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#0F172A] border border-border-subtle">
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
                    <span className="text-[#EF4444]">⚠️ SQUIB LOAD:</span>
                    <span>Projectile Lodged in Bore (Extreme Danger of Catastrophic Rupture)</span>
                  </div>
                  <p className="text-text-secondary text-xs mt-2 leading-relaxed">
                    <strong>Symptoms:</strong> Faint "pop" sound instead of standard report; noticeably weak recoil; smoke exiting chamber.
                    <br />
                    <strong>Action:</strong> Immediately command shooter to STOP. Do NOT allow another round to be chambered or fired. Unload firearm, lock action open, inspect bore with light. If obstructed, firearm must be tagged OUT_OF_SERVICE and cleared in the armory using a brass squib rod.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0F172A] border border-border-subtle">
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
                    <span className="text-[#F5A623]">⚠️ HANGFIRE:</span>
                    <span>Delayed Primer / Propellant Deflagration</span>
                  </div>
                  <p className="text-text-secondary text-xs mt-2 leading-relaxed">
                    <strong>Symptoms:</strong> Trigger is pulled; firing pin clicks against primer, but cartridge does not detonate immediately.
                    <br />
                    <strong>Action:</strong> Keep firearm pointed strictly downrange. Wait a full <strong>60 seconds</strong> (30s for .22 LR rimfire). After elapsed time, safely cycle action to eject unfired round into a sand-filled disposal container.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: COMPLIANCE, OSHA & STATUTORY REGULATIONS */}
        {activeSection === 'compliance' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <span className="text-[#38BDF8] font-mono text-xs font-bold uppercase tracking-wider">SECTION 2.0</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">
                OSHA, EPA & Statutory Firearms Legal Regulations
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Operating a physical shooting facility requires stringent adherence to federal occupational safety, acoustic attenuation, lead abatement, and ATF armory tracking laws.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🫁</span>
                  <h3 className="font-display font-bold text-base text-white">
                    OSHA 29 CFR 1910.1025 (Lead Management)
                  </h3>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 leading-relaxed list-disc list-inside">
                  <li><strong className="text-white">Ventilation Airspeed:</strong> Minimum 50 to 75 feet per minute (fpm) downrange laminar flow across all firing points.</li>
                  <li><strong className="text-white">Negative Pressure:</strong> Firing bay must maintain negative pressure relative to the staging lobby to prevent lead particulate migration.</li>
                  <li><strong className="text-white">Hygiene Mandates:</strong> Eating, drinking, smoking, and vaping are strictly prohibited on the range. Mandatory hand washing with D-Lead soap prior to eating or leaving facility.</li>
                  <li><strong className="text-white">Cleanup Standards:</strong> Dry sweeping is illegal under OSHA lead standards. Use certified HEPA-filtered vacuum systems or damp mop with lead-neutralizing agent.</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎧</span>
                  <h3 className="font-display font-bold text-base text-white">
                    OSHA 29 CFR 1910.95 (Noise & Hearing Conservation)
                  </h3>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 leading-relaxed list-disc list-inside">
                  <li><strong className="text-white">Peak Acoustic Limit:</strong> Maximum 140 dB peak sound pressure level (SPL).</li>
                  <li><strong className="text-white">Mandatory Hearing Protection:</strong> All range entrants and staff must wear eye protection (ANSI Z87.1) and hearing protection with a minimum Noise Reduction Rating (NRR) of 28 dB.</li>
                  <li><strong className="text-white">High-Power Indoor Rule:</strong> For centerfire rifle calibers indoors (.223 / 5.56, .308, etc.), dual hearing protection (earplugs NRR 25+ combined with over-ear muffs NRR 28+) is required for staff.</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <h3 className="font-display font-bold text-base text-white">
                    ATF 27 CFR Part 478 (Rental Armory Compliance)
                  </h3>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 leading-relaxed list-disc list-inside">
                  <li><strong className="text-white">Serialized A&D Ledger:</strong> All rental firearms must have manufacturer, model, serial number, and caliber logged in the Marksman Equipment Module.</li>
                  <li><strong className="text-white">Custody Transfer Verification:</strong> Temporary issuance requires verified government photo identification matching customer database record.</li>
                  <li><strong className="text-white">Prohibited Persons Check:</strong> Firearms and ammunition shall never be provided to individuals exhibiting signs of impairment or legally disqualified under state/federal statutes.</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  <h3 className="font-display font-bold text-base text-white">
                    Target Camera Privacy & Biometrics (GDPR / CCPA)
                  </h3>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 leading-relaxed list-disc list-inside">
                  <li><strong className="text-white">Downrange Optical Target Isolation:</strong> Cameras exclusively point downrange at target backers. Facial recognition or human surveillance algorithms are strictly disabled.</li>
                  <li><strong className="text-white">Biometric Telemetry Encryption:</strong> Heart rate and stress sensor feeds are encrypted with AES-256 at rest and TLS 1.3 in transit.</li>
                  <li><strong className="text-white">Audit Trail Admissibility:</strong> RSO cease-fires, lane overrides, and incident reports are written to an immutable AuditLog table for legal chain of custody.</li>
                </ul>
              </div>
            </div>

            <AlertBox type="info" title="Statutory Liability Waivers & Minor Participants">
              Every shooter must have an active Form 101 Release & Hold Harmless agreement executed within the last 365 days. Minor shooters (under 18 years) must have a legal guardian co-signature and remain under direct, arm's-length supervision by an adult at all times on the firing line.
            </AlertBox>
          </div>
        )}

        {/* SECTION 3: EMERGENCY TRAUMA & MEDICAL RESPONSE */}
        {activeSection === 'emergency' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <span className="text-[#EF4444] font-mono text-xs font-bold uppercase tracking-wider">SECTION 3.0</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">
                Emergency Medical, Trauma & Gunshot Wound Protocol
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Gunshot injuries require immediate, disciplined hemorrhage control following Tactical Combat Casualty Care (TCCC) principles adapted for shooting facilities.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-[#EF4444]/15 via-[#0F172A] to-[#0F172A] border border-[#EF4444]/40 space-y-4">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <span>🩸</span> TCCC MARCH Trauma Protocol for Gunshot Wounds
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-[#0F172A] border border-border-subtle space-y-2">
                  <span className="text-xs font-mono font-bold text-[#EF4444] bg-[#EF4444]/20 px-2 py-0.5 rounded">
                    M — MASSIVE BLEEDING
                  </span>
                  <h4 className="text-sm font-bold text-white">Extremity Tourniquet</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Apply commercial windlass tourniquet (CAT / SOF-T) 2–3 inches above bleeding site on arm or leg. Tighten windlass until arterial pulsing stops. Write exact application time on strap.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0F172A] border border-border-subtle space-y-2">
                  <span className="text-xs font-mono font-bold text-[#F5A623] bg-[#F5A623]/20 px-2 py-0.5 rounded">
                    A — AIRWAY & CHEST
                  </span>
                  <h4 className="text-sm font-bold text-white">Vented Chest Seals</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    For torso / chest penetration, immediately apply vented chest seal to both entry and exit wounds to prevent tension pneumothorax. Position casualty in recovery position.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0F172A] border border-border-subtle space-y-2">
                  <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/20 px-2 py-0.5 rounded">
                    R — RESCUE & 911
                  </span>
                  <h4 className="text-sm font-bold text-white">Designated 911 Caller</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Assign a specific person by name to call 911. Direct a second staff member to meet EMS at the facility entrance gate with a clear path to the bay.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-display font-semibold text-white">
                911 Dispatch Phone Script (Keep Posted by Range Phone)
              </h3>
              <div className="p-4 rounded-xl bg-[#0F172A] border border-border-subtle font-mono text-xs text-text-primary space-y-2">
                <p className="text-[#38BDF8]">
                  "THIS IS [RANGE FACILITY NAME] AT [PHYSICAL ADDRESS / GPS COORDINATES]."
                </p>
                <p>
                  "WE HAVE AN ACCIDENTAL GUNSHOT WOUND TO THE [ARM / LEG / CHEST] OF AN ADULT. ACTIVE HEMORRHAGE IS CONTROLLED VIA TOURNIQUET."
                </p>
                <p>
                  "THE RANGE IS MADE SAFE. ALL FIREARMS ARE UNLOADED AND BENCHED. OUR STAFF GUIDE WILL MEET EMERGENCY RESPONDERS AT THE MAIN ENTRANCE."
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-border-subtle pt-6">
              <h3 className="text-base font-display font-semibold text-white">
                Post-Incident Digital Reporting (`POST /safety/incidents`)
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Within 2 hours of casualty transport, the Chief RSO must file an official digital incident report in the Marksman console. Record firearm serial number, caliber, ammunition lot number, witness accounts, and preserve downrange target camera video frames for legal documentation.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 4: SOFTWARE CONSOLE OPERATIONS GUIDE */}
        {activeSection === 'console' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <span className="text-[#10B981] font-mono text-xs font-bold uppercase tracking-wider">SECTION 4.0</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">
                Marksman Range Operations Console Guide
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Operating the Next.js Range Management Web Application on <strong>`http://localhost:3002`</strong> and interacting with backend API <strong>`:3003`</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-white">
                    Emergency Cease-Fire Software Relay
                  </h3>
                  <span className="text-xs font-mono text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded">
                    WebSocket Instant Broadcast
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Located in the top navigation bar of the operator dashboard. Clicking <strong>"BROADCAST CEASEFIRE"</strong> triggers an instantaneous WebSocket payload to all lane monitors, mobile apps, and TV kiosks.
                </p>
                <div className="p-3 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-[#EF4444]">
                  POST /gateway/ceasefire {'{ rangeId: "...", triggeredBy: "RSO-01" }'}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-white">
                    Turnstile Gate QR Access Validation
                  </h3>
                  <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded">
                    Hardware Interlock
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Athletes present their digital membership card QR code. The turnstile gate validator verifies:
                </p>
                <ul className="text-xs text-text-secondary list-disc list-inside space-y-1">
                  <li>Valid membership subscription or hourly slot booking</li>
                  <li>Signed liability waiver on file (within 365 days)</li>
                  <li>Zero active safety suspension holds on athlete record</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-white">
                    Live Hourly Lane Matrix & Overrides
                  </h3>
                  <span className="text-xs font-mono text-[#38BDF8] bg-[#38BDF8]/15 px-2 py-0.5 rounded">
                    Booking Management
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Accessible at <code>/range-operator/bookings</code>. Operators can view real-time lane occupancy, allocate walk-in shooters to vacant slots, extend session times, or put lanes in maintenance hold.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-white">
                    Live Environmental Telemetry
                  </h3>
                  <span className="text-xs font-mono text-[#F5A623] bg-[#F5A623]/15 px-2 py-0.5 rounded">
                    OpenMeteo Integration
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Real-time ambient temperature, barometric pressure, crosswind velocity, and wind-score correlation matrix to assist precision shooters with elevation/windage calibration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: HARDWARE & TARGET CAMERA RIG */}
        {activeSection === 'hardware' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <span className="text-[#F5A623] font-mono text-xs font-bold uppercase tracking-wider">SECTION 5.0</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">
                Target Camera Hardware, Ballistic Armor & Optical Specs
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Physical specifications for downrange target line cameras, AR500 ballistic deflector steel, lighting requirements, and computer vision calibration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <span className="text-xl">🛡️</span>
                <h3 className="font-display font-bold text-base text-white">
                  3/8" AR500 Armor Shielding
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Camera housing must be enclosed in minimum 3/8" (9.5mm) AR500 ballistic steel angled at a <strong>45-degree downward angle</strong> to deflect direct impacts safely into the floor/berm.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <span className="text-xl">💡</span>
                <h3 className="font-display font-bold text-base text-white">
                  1,000–1,500 Lux DC Lighting
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Direct Current (DC) constant-voltage LED floodlights eliminate rolling-shutter 50/60Hz AC strobe artifacts, ensuring crisp edge contrast around bullet perforations.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
                <span className="text-xl">🔍</span>
                <h3 className="font-display font-bold text-base text-white">
                  Sacrificial Polycarbonate Lens
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Optical viewing port protected by replaceable 1/2" Lexan scratch-resistant polycarbonate to protect phone camera lens from carbon blowout and copper debris.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0F172A] border border-border-subtle space-y-3">
              <h3 className="font-display font-bold text-base text-white">
                Perspective Transform & Homography Matrix Calibration
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                The Target Camera is positioned off-axis to avoid direct line-of-fire. During pre-session setup, technician aligns the 4 corner markers of the target backer. The OpenCV engine calculates a 3x3 Homography Matrix to map angled camera coordinates to a perpendicular Cartesian plane, yielding sub-millimeter precision.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 6: RUBRIC & PRE-OPENING CHECKLIST */}
        {activeSection === 'rubric' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <span className="text-[#10B981] font-mono text-xs font-bold uppercase tracking-wider">SECTION 6.0</span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">
                Interactive Pre-Opening Inspection & RSO Certification
              </h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Conduct the daily pre-opening inspection checklist directly on your tablet before admitting athletes to the firing line.
              </p>
            </div>

            {/* Checklist Progress Bar */}
            <div className="p-6 rounded-xl bg-[#0F172A] border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Daily Facility Pre-Opening Checklist
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Required prior to setting range line to ACTIVE</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-bold text-[#F5A623]">
                    {checklistCompletion}%
                  </span>
                  <p className="text-[10px] font-mono uppercase text-text-muted">READINESS</p>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F5A623] to-[#10B981] transition-all duration-300"
                  style={{ width: `${checklistCompletion}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  { key: 'baffles', label: 'Baffles, bullet traps & deflectors inspected for spalling' },
                  { key: 'ventilation', label: 'Exhaust airflow verified 50–75 fpm downrange laminar' },
                  { key: 'targetCam', label: 'Target cameras powered, lenses cleaned & streaming' },
                  { key: 'ceasefireRelay', label: 'Emergency Cease-Fire hardware & software relay tested' },
                  { key: 'ifakSeals', label: 'Trauma IFAK / CAT Tourniquet kit unbroken seal confirmed' },
                  { key: 'waiversEnforced', label: 'Digital liability waivers & gate turnstile interlock active' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleChecklist(item.key)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      checklist[item.key]
                        ? 'bg-[#10B981]/10 border-[#10B981]/40 text-white'
                        : 'bg-black/20 border-border-subtle text-text-muted hover:border-white/20'
                    }`}
                  >
                    <span className="text-base mt-0.5">
                      {checklist[item.key] ? '✅' : '⬜'}
                    </span>
                    <span className="text-xs font-medium leading-relaxed">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#0F172A] border border-border-subtle space-y-4">
              <h3 className="font-display font-bold text-base text-white">
                RSO 100-Point Certification Rubric
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[#F5A623] font-bold font-mono">DOMAIN 1 (25 PTS)</span>
                  <h4 className="font-bold text-white">Statutory Regulations</h4>
                  <p className="text-text-muted">OSHA lead rules, NRR acoustic mandates, ATF A&D ledger compliance.</p>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[#38BDF8] font-bold font-mono">DOMAIN 2 (25 PTS)</span>
                  <h4 className="font-bold text-white">Line Command & Control</h4>
                  <p className="text-text-muted">Verbal clarity, visual coverage, Cease-Fire execution, stance.</p>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[#EF4444] font-bold font-mono">DOMAIN 3 (25 PTS)</span>
                  <h4 className="font-bold text-white">Weapon Malfunctions</h4>
                  <p className="text-text-muted">Safe clearance of squibs, hangfires, double-feeds under 45 seconds.</p>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[#10B981] font-bold font-mono">DOMAIN 4 (25 PTS)</span>
                  <h4 className="font-bold text-white">Emergency Trauma & Console</h4>
                  <p className="text-text-muted">CAT tourniquet in &lt;30s, 911 dispatch communication, software operations.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Reference Section */}
      <div className="p-6 rounded-xl bg-[#0F172A]/60 border border-border-subtle/50 flex flex-wrap items-center justify-between gap-4 text-xs text-text-muted font-mono">
        <div>
          <span>Official Documents: </span>
          <span className="text-[#F5A623]">docs/LEGAL_COMPLIANCE_AND_STANDARDS.md</span> • <span className="text-[#38BDF8]">docs/RANGE_OPERATOR_AND_RSO_MANUAL.md</span>
        </div>
        <div>
          <span>Compliance Version: </span>
          <span className="text-white font-bold">2026.1-STABLE</span>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <AppShell title="Range Operator & RSO Manual">
      <Suspense fallback={<div className="p-8 text-text-muted font-mono">Loading Operating Manual...</div>}>
        <OperatorManualInner />
      </Suspense>
    </AppShell>
  );
}
