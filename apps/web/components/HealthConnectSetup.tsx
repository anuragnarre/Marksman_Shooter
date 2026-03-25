// apps/web/components/HealthConnectSetup.tsx
'use client';

// 3-step "Marksman Pulse" setup wizard for Health Connect.
// Shown inline when no HEALTH_CONNECT device is registered.

import { useState } from 'react';
import {
  isAvailable,
  requestPermissions,
  checkPermissions,
  syncToBackend,
} from '../lib/health-connect';

interface Props {
  onComplete: () => void;
}

type Step = 'check' | 'permissions' | 'sync' | 'done';

const METRIC_LABELS = [
  { key: 'heartRate',            label: 'Heart Rate',          color: '#FF4D6D' },
  { key: 'oxygenSaturation',     label: 'Blood Oxygen (SpO₂)', color: '#4FC3F7' },
  { key: 'respiratoryRate',      label: 'Respiratory Rate',    color: '#00E5A0' },
  { key: 'heartRateVariability', label: 'HRV (Recovery)',      color: '#F5A623' },
  { key: 'steps',                label: 'Steps',               color: '#A78BFA' },
  { key: 'calories',             label: 'Calories',            color: '#34D399' },
];

export function HealthConnectSetup({ onComplete }: Props) {
  const [step, setStep]             = useState<Step>('check');
  const [checking, setChecking]     = useState(false);
  const [compatible, setCompatible] = useState<boolean | null>(null);
  const [granting, setGranting]     = useState(false);
  const [granted, setGranted]       = useState<string[]>([]);
  const [syncing, setSyncing]       = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncCounts, setSyncCounts] = useState<Record<string, number>>({});
  const [error, setError]           = useState<string | null>(null);

  async function handleCheck() {
    setChecking(true);
    setError(null);
    try {
      const ok = await isAvailable();
      setCompatible(ok);
      if (ok) {
        const existing = await checkPermissions();
        if (existing.length >= 3) {
          setGranted(existing);
          setStep('sync');
        } else {
          setStep('permissions');
        }
      }
    } catch {
      setError('Could not check compatibility. Make sure Health Connect is installed.');
    }
    setChecking(false);
  }

  async function handleGrant() {
    setGranting(true);
    setError(null);
    try {
      const ok = await requestPermissions();
      if (ok) {
        const perms = await checkPermissions();
        setGranted(perms);
        setStep('sync');
      } else {
        setError('Some permissions were denied. Please grant all permissions to continue.');
      }
    } catch {
      setError('Failed to request permissions. Please try again.');
    }
    setGranting(false);
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setSyncProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setSyncProgress(p => Math.min(p + 15, 85));
      }, 400);

      const result = await syncToBackend({ hoursBack: 24 });

      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncCounts(result.counts as unknown as Record<string, number>);
      setStep('done');
    } catch {
      setError('Sync failed. Please check your connection and try again.');
      setSyncProgress(0);
    }
    setSyncing(false);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(79,195,247,0.04) 100%)',
        border: '1px solid rgba(245,166,35,0.18)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(245,166,35,0.12)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}
        >
          <PulseIcon />
        </div>
        <div>
          <p className="font-display font-bold text-sm tracking-wide" style={{ color: '#F5A623' }}>
            MARKSMAN PULSE
          </p>
          <p className="text-[10px] font-display tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Health Connect Integration
          </p>
        </div>
        <div className="ml-auto">
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {step === 'check' && (
          <StepCheck
            compatible={compatible}
            checking={checking}
            error={error}
            onCheck={handleCheck}
          />
        )}
        {step === 'permissions' && (
          <StepPermissions
            granted={granted}
            granting={granting}
            error={error}
            onGrant={handleGrant}
          />
        )}
        {step === 'sync' && (
          <StepSync
            syncing={syncing}
            progress={syncProgress}
            error={error}
            onSync={handleSync}
          />
        )}
        {step === 'done' && (
          <StepDone
            counts={syncCounts}
            onComplete={onComplete}
          />
        )}
      </div>
    </div>
  );
}

// ── Step 1: Compatibility Check ────────────────────────────────────────────────

function StepCheck({
  compatible, checking, error, onCheck,
}: {
  compatible: boolean | null;
  checking: boolean;
  error: string | null;
  onCheck: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-text-primary mb-1">Connect your wearable data</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Marksman Pulse reads biometrics from Health Connect — the Android health data hub.
        </p>
      </div>

      <div className="space-y-2">
        {[
          { label: 'Android 9+ device',        ok: true },
          { label: 'Health Connect installed',  ok: null },
          { label: 'Wearable or phone sensors', ok: null },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
              style={{
                background: ok === true
                  ? 'rgba(0,229,160,0.15)'
                  : compatible === false
                    ? 'rgba(255,77,109,0.15)'
                    : 'rgba(245,166,35,0.1)',
                color: ok === true ? '#00E5A0' : compatible === false ? '#FF4D6D' : '#F5A623',
              }}
            >
              {ok === true ? '✓' : compatible === false ? '✗' : '?'}
            </span>
            {label}
          </div>
        ))}
      </div>

      {compatible === false && (
        <div
          className="p-3 rounded-xl text-xs"
          style={{ background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.2)', color: '#FF4D6D' }}
        >
          Health Connect is not available on this device. Make sure you are using the Marksman Android app and have Health Connect installed from the Play Store.
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {compatible !== false && (
        <button
          onClick={onCheck}
          disabled={checking}
          className="btn btn-primary w-full"
          style={{ fontSize: 13 }}
        >
          {checking ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Checking compatibility...
            </span>
          ) : (
            'Check Compatibility'
          )}
        </button>
      )}
    </div>
  );
}

// ── Step 2: Permissions ────────────────────────────────────────────────────────

function StepPermissions({
  granted, granting, error, onGrant,
}: {
  granted: string[];
  granting: boolean;
  error: string | null;
  onGrant: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-text-primary mb-1">Grant biometric access</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Marksman Pulse needs read access to the following data types.
        </p>
      </div>

      <div className="space-y-1.5">
        {METRIC_LABELS.map(({ key, label, color }) => {
          const isGranted = granted.includes(key);
          return (
            <div
              key={key}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: isGranted ? '#00E5A0' : color, opacity: isGranted ? 1 : 0.5 }}
              />
              <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              {isGranted && (
                <span className="text-[10px] font-display font-bold uppercase tracking-wider" style={{ color: '#00E5A0' }}>
                  Granted
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && <ErrorBox message={error} />}

      <button
        onClick={onGrant}
        disabled={granting}
        className="btn btn-primary w-full"
        style={{ fontSize: 13 }}
      >
        {granting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner /> Requesting permissions...
          </span>
        ) : (
          'Grant Permissions'
        )}
      </button>
    </div>
  );
}

// ── Step 3: Initial Sync ───────────────────────────────────────────────────────

function StepSync({
  syncing, progress, error, onSync,
}: {
  syncing: boolean;
  progress: number;
  error: string | null;
  onSync: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-text-primary mb-1">Initial data sync</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          We'll read the last 24 hours of biometric data and register Marksman Pulse as your device.
        </p>
      </div>

      {syncing && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-display uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            <span>Reading health data</span>
            <span>{progress}%</span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(245,166,35,0.12)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #F5A623 0%, #4FC3F7 100%)',
              }}
            />
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Reading HR · SpO₂ · Resp Rate · HRV · Steps · Calories...
          </p>
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {!syncing && (
        <button
          onClick={onSync}
          className="btn btn-primary w-full"
          style={{ fontSize: 13 }}
        >
          Start Initial Sync
        </button>
      )}
    </div>
  );
}

// ── Step 4: Done ───────────────────────────────────────────────────────────────

function StepDone({
  counts, onComplete,
}: {
  counts: Record<string, number>;
  onComplete: () => void;
}) {
  const countMap: Array<{ label: string; value: number; color: string }> = [
    { label: 'Heart Rate', value: counts.heartRate ?? 0, color: '#FF4D6D' },
    { label: 'SpO₂', value: counts.spo2 ?? 0, color: '#4FC3F7' },
    { label: 'Resp Rate', value: counts.respiratoryRate ?? 0, color: '#00E5A0' },
    { label: 'HRV', value: counts.hrv ?? 0, color: '#F5A623' },
  ];

  const total = countMap.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,229,160,0.15)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#00E5A0" strokeWidth="2" strokeLinecap="round">
            <polyline points="4,10 8,14 16,6" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Marksman Pulse connected!</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {total > 0 ? `${total} readings synced from the last 24 hours` : 'Device registered — no data in the last 24h yet'}
          </p>
        </div>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {countMap.map(({ label, value, color }) => (
            <div
              key={label}
              className="px-3 py-2 rounded-lg text-center"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <p className="font-data font-bold text-lg" style={{ color }}>
                {value}
              </p>
              <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onComplete}
        className="btn btn-primary w-full"
        style={{ fontSize: 13 }}
      >
        View Your Data
      </button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['check', 'permissions', 'sync', 'done'];
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <span
          key={s}
          className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{
            background: i <= idx ? '#F5A623' : 'rgba(255,255,255,0.1)',
            transform: i === idx ? 'scale(1.3)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'rgba(255,77,109,0.06)',
        border: '1px solid rgba(255,77,109,0.2)',
        color: '#FF4D6D',
      }}
    >
      {message}
    </div>
  );
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,12 6,12 8,5 10,19 12,10 14,14 16,12 22,12" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="w-4 h-4 border-2 border-t-[#F5A623] border-[rgba(245,166,35,0.2)] rounded-full animate-spin"
      aria-hidden="true"
    />
  );
}
