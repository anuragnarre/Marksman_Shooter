// apps/web/components/DeviceManager.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';
import {
  isAvailable as isHealthConnectAvailable,
  requestPermissions,
  syncToBackend,
} from '../lib/health-connect';
import { HealthConnectSetup } from './HealthConnectSetup';
import type { DeviceRegistration, BiometricReading } from '@shooting-platform/shared-types';

interface Device {
  id: string;
  deviceName: string;
  deviceType: string;
  lastSeenAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface DeviceDetail {
  id: string;
  deviceName: string;
  deviceType: string;
  lastSeenAt: string | null;
  isActive: boolean;
  createdAt: string;
  totalReadings: number;
  readingsLast24h: number;
  linkedSessionCount: number;
  lastReading: BiometricReading | null;
  recentReadings: BiometricReading[];
}

export function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('CUSTOM_SENSOR');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hcAvailable, setHcAvailable] = useState(false);
  const [hcSyncing, setHcSyncing] = useState(false);
  const [hcLastSync, setHcLastSync] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function loadDevices() {
    try {
      const data = await apiFetch<Device[]>('/biometrics/devices');
      setDevices(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    loadDevices();
    isHealthConnectAvailable().then(setHcAvailable);
  }, []);

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      setTestResult(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setTestResult(null);
    setDetailLoading(true);
    try {
      const d = await apiFetch<DeviceDetail>(`/biometrics/devices/${id}`);
      setDetail(d);
    } catch {
      setDetail(null);
    }
    setDetailLoading(false);
  }

  async function handleRegister() {
    if (!newName.trim()) return;
    try {
      const result = await apiFetch<DeviceRegistration>('/biometrics/devices', {
        method: 'POST',
        body: JSON.stringify({ deviceName: newName.trim(), deviceType: newType }),
      });
      setCreatedKey(result.apiKey ?? null);
      setNewName('');
      setShowForm(false);
      loadDevices();
    } catch {}
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await apiFetch(`/biometrics/devices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      loadDevices();
      if (expandedId === id) handleExpand(id);
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this device and all its readings?')) return;
    try {
      await apiFetch(`/biometrics/devices/${id}`, { method: 'DELETE' });
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
      loadDevices();
    } catch {}
  }

  async function handleCopyKey() {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleTestConnection(deviceId: string) {
    setTestResult(null);
    try {
      const d = await apiFetch<DeviceDetail>(`/biometrics/devices/${deviceId}`);
      if (d.lastReading) {
        const age = Date.now() - new Date(d.lastReading.timestamp).getTime();
        if (age < 5 * 60 * 1000) {
          setTestResult('Device is live! Last reading received ' + Math.round(age / 1000) + 's ago.');
        } else {
          setTestResult('Device reachable but last reading was ' + formatTimeAgo(String(d.lastReading.timestamp)) + '. Check if sensor is active.');
        }
      } else {
        setTestResult('No readings received from this device yet. Make sure the sensor is powered on and the API key is configured.');
      }
    } catch {
      setTestResult('Failed to check device status. Try again.');
    }
  }

  async function handleHealthConnect() {
    const granted = await requestPermissions();
    if (granted) loadDevices();
  }

  async function handleHcSync() {
    setHcSyncing(true);
    try {
      await syncToBackend({ hoursBack: 24 });
      setHcLastSync(new Date());
      await loadDevices();
    } catch {}
    setHcSyncing(false);
  }

  function isOnline(lastSeen: string | null): boolean {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
  }

  if (loading) {
    return <div className="card p-6 animate-pulse" style={{ height: 200 }} />;
  }

  return (
    <div className="space-y-4">
      {/* Created key banner */}
      {createdKey && (
        <div className="card p-4" style={{ border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(245,166,35,0.05)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#F5A623' }}>
            Device API Key (shown once -- save it now!)
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs break-all p-2 rounded"
              style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)' }}>
              {createdKey}
            </code>
            <button onClick={handleCopyKey} className="btn-primary px-3 py-1.5 text-xs shrink-0">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="text-xs mt-2 underline" style={{ color: 'var(--text-secondary)' }}>
            I've saved it, dismiss
          </button>
        </div>
      )}

      {/* Device list */}
      {devices.length > 0 ? (
        <div className="space-y-2">
          {devices.map(d => (
            <div key={d.id}>
              {/* Device row */}
              <button
                onClick={() => handleExpand(d.id)}
                className="card p-4 flex items-center gap-3 w-full text-left transition-all hover:border-[rgba(245,166,35,0.15)]"
                style={{
                  borderColor: expandedId === d.id ? 'rgba(245,166,35,0.2)' : undefined,
                  background: expandedId === d.id ? 'rgba(245,166,35,0.03)' : undefined,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: isOnline(d.lastSeenAt) ? '#00E5A0' : '#4A5568',
                    boxShadow: isOnline(d.lastSeenAt) ? '0 0 6px rgba(0,229,160,0.7)' : 'none',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{d.deviceName}</p>
                  <p className="text-[10px] font-display uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    {d.deviceType.replace(/_/g, ' ')}
                    {d.lastSeenAt ? ` · Last seen ${formatTimeAgo(d.lastSeenAt)}` : ' · Never connected'}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-[10px] font-display font-bold uppercase tracking-wider shrink-0"
                  style={{
                    background: d.isActive ? 'rgba(0,229,160,0.1)' : 'rgba(255,77,109,0.1)',
                    color: d.isActive ? '#00E5A0' : '#FF4D6D',
                    border: `1px solid ${d.isActive ? 'rgba(0,229,160,0.2)' : 'rgba(255,77,109,0.2)'}`,
                  }}
                >
                  {d.isActive ? 'Active' : 'Disabled'}
                </span>
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round"
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: expandedId === d.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <polyline points="3,5 7,9 11,5" />
                </svg>
              </button>

              {/* Expanded detail panel */}
              {expandedId === d.id && (
                <div className="card mt-1 p-5 space-y-4 animate-slide-up" style={{ borderTop: '2px solid rgba(245,166,35,0.15)' }}>
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading device details...</span>
                    </div>
                  ) : detail ? (
                    <>
                      {/* Stats row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatBox label="Total Readings" value={String(detail.totalReadings)} color="#F5A623" />
                        <StatBox label="Last 24 Hours" value={String(detail.readingsLast24h)} color="#4FC3F7" />
                        <StatBox label="Sessions Linked" value={String(detail.linkedSessionCount)} color="#00E5A0" />
                        <StatBox
                          label="Status"
                          value={isOnline(detail.lastSeenAt) ? 'Online' : 'Offline'}
                          color={isOnline(detail.lastSeenAt) ? '#00E5A0' : '#FF4D6D'}
                        />
                      </div>

                      {/* Last reading */}
                      {detail.lastReading && (
                        <div className="card p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <p className="text-[10px] font-display font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Latest Reading
                          </p>
                          <div className="flex items-center gap-6">
                            {detail.lastReading.heartRate !== null && (
                              <div className="flex items-baseline gap-1">
                                <span className="font-mono text-xl font-bold" style={{ color: '#FF4D6D' }}>
                                  {detail.lastReading.heartRate}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>bpm</span>
                              </div>
                            )}
                            {detail.lastReading.spo2 !== null && (
                              <div className="flex items-baseline gap-1">
                                <span className="font-mono text-xl font-bold" style={{ color: '#4FC3F7' }}>
                                  {detail.lastReading.spo2}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>% SpO2</span>
                              </div>
                            )}
                            <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                              {new Date(detail.lastReading.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Recent readings mini table */}
                      {detail.recentReadings.length > 0 && (
                        <div>
                          <p className="text-[10px] font-display font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Recent Readings ({Math.min(detail.recentReadings.length, 10)} of {detail.totalReadings})
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <th className="text-left py-1.5 px-2 font-display uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Time</th>
                                  <th className="text-right py-1.5 px-2 font-display uppercase tracking-wider" style={{ color: '#FF4D6D' }}>HR</th>
                                  <th className="text-right py-1.5 px-2 font-display uppercase tracking-wider" style={{ color: '#4FC3F7' }}>SpO2</th>
                                  <th className="text-right py-1.5 px-2 font-display uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.recentReadings.slice(0, 10).map((r, i) => (
                                  <tr key={r.id ?? i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td className="py-1.5 px-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
                                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono font-bold" style={{ color: '#FF4D6D' }}>
                                      {r.heartRate ?? '-'}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono font-bold" style={{ color: '#4FC3F7' }}>
                                      {r.spo2 != null ? `${r.spo2}%` : '-'}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--text-muted)' }}>
                                      {r.readingType?.replace('_', ' ')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Test connection result */}
                      {testResult && (
                        <div className="card p-3 text-xs" style={{
                          background: testResult.includes('live') ? 'rgba(0,229,160,0.05)' : 'rgba(245,166,35,0.05)',
                          border: `1px solid ${testResult.includes('live') ? 'rgba(0,229,160,0.2)' : 'rgba(245,166,35,0.2)'}`,
                          color: testResult.includes('live') ? '#00E5A0' : '#F5A623',
                        }}>
                          {testResult}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => handleTestConnection(d.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all"
                          style={{
                            background: 'rgba(79,195,247,0.1)',
                            color: '#4FC3F7',
                            border: '1px solid rgba(79,195,247,0.2)',
                          }}
                        >
                          Test Connection
                        </button>
                        <button
                          onClick={() => handleToggle(d.id, !d.isActive)}
                          className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all"
                          style={{
                            background: d.isActive ? 'rgba(255,77,109,0.1)' : 'rgba(0,229,160,0.1)',
                            color: d.isActive ? '#FF4D6D' : '#00E5A0',
                            border: `1px solid ${d.isActive ? 'rgba(255,77,109,0.2)' : 'rgba(0,229,160,0.2)'}`,
                          }}
                        >
                          {d.isActive ? 'Disable Device' : 'Enable Device'}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all"
                          style={{
                            background: 'rgba(255,77,109,0.06)',
                            color: '#FF4D6D',
                            border: '1px solid rgba(255,77,109,0.15)',
                          }}
                        >
                          Remove Device
                        </button>
                      </div>

                      {/* Device info */}
                      <div className="text-[10px] space-y-0.5 pt-1" style={{ color: 'var(--text-muted)' }}>
                        <p>Device ID: <span className="font-mono">{d.id}</span></p>
                        <p>Type: {d.deviceType.replace(/_/g, ' ')}</p>
                        <p>Registered: {new Date(d.createdAt).toLocaleDateString()}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-sm" style={{ color: '#FF4D6D' }}>Failed to load device details</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <div className="mb-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="1.2" strokeLinecap="round" className="mx-auto">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              <polyline points="6,11 10,11 11,9 13,13 14,11 18,11" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">No Devices Registered</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Connect an Arduino pulse sensor or Android wearable to start tracking biometrics during sessions.
          </p>
        </div>
      )}

      {/* Register Arduino / Custom Sensor */}
      {showForm ? (
        <div className="card p-5 space-y-4">
          <div>
            <p className="font-display font-semibold text-sm text-text-primary">Register Arduino Sensor</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Give your device a name. You'll get a unique API key to put in the Arduino firmware.
            </p>
          </div>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Device name (e.g. My Pulse Oximeter)"
            className="field w-full"
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
          <div className="flex gap-2">
            <button onClick={handleRegister} className="btn-primary px-4 py-2 text-sm">Register & Get API Key</button>
            <button onClick={() => { setShowForm(false); setNewType('CUSTOM_SENSOR'); }} className="px-4 py-2 text-sm rounded" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setShowForm(true); setNewType('CUSTOM_SENSOR'); }} className="btn-primary px-4 py-2 text-sm w-full">
          + Register Arduino Sensor
        </button>
      )}

      {/* ── Marksman Pulse / Health Connect ─────────────────────────────── */}
      {(() => {
        const hcDevice = devices.find(d => d.deviceType === 'HEALTH_CONNECT');
        if (!hcAvailable && !hcDevice) {
          // Web / iOS: show plain info card
          return (
            <div className="card p-5" style={{ border: '1px solid rgba(245,166,35,0.15)' }}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.1)' }}>
                  <PulseIconSvg />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold font-display" style={{ color: '#F5A623' }}>MARKSMAN PULSE</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Syncs heart rate, SpO₂, HRV, breathing rate, steps and calories from Health Connect automatically.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="7" cy="7" r="6" />
                      <line x1="7" y1="4" x2="7" y2="7.5" />
                      <circle cx="7" cy="10" r="0.5" fill="#F5A623" stroke="none" />
                    </svg>
                    Available on the Marksman Android app (Android 9+)
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (hcAvailable && !hcDevice) {
          // Android, no device yet — show setup wizard
          return (
            <HealthConnectSetup onComplete={() => loadDevices()} />
          );
        }

        if (hcDevice) {
          // Registered — show branded card
          const online = isOnline(hcDevice.lastSeenAt);
          return (
            <div
              className="card p-5"
              style={{
                border: '1px solid rgba(245,166,35,0.2)',
                background: 'rgba(245,166,35,0.02)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <PulseIconSvg />
                  <div>
                    <p className="font-display font-bold text-sm tracking-wide" style={{ color: '#F5A623' }}>
                      MARKSMAN PULSE
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Health Connect Integration
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: online ? '#00E5A0' : '#4A5568',
                      boxShadow: online ? '0 0 5px rgba(0,229,160,0.7)' : 'none',
                    }}
                  />
                  <span
                    className="text-[10px] font-display font-bold uppercase tracking-wider"
                    style={{ color: online ? '#00E5A0' : '#4A5568' }}
                  >
                    {online ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="px-3 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.025)' }}>
                  <p className="font-data text-lg font-bold" style={{ color: '#F5A623' }}>
                    {hcLastSync
                      ? formatTimeAgoShort(hcLastSync)
                      : hcDevice.lastSeenAt
                        ? formatTimeAgoShort(new Date(hcDevice.lastSeenAt))
                        : 'Never'}
                  </p>
                  <p className="text-[10px] font-display uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Last Sync
                  </p>
                </div>
                <div className="px-3 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.025)' }}>
                  <p className="font-data text-lg font-bold" style={{ color: '#4FC3F7' }}>
                    6
                  </p>
                  <p className="text-[10px] font-display uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Metrics
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleHcSync}
                  disabled={hcSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: hcSyncing ? 'rgba(245,166,35,0.06)' : 'rgba(245,166,35,0.12)',
                    color: '#F5A623',
                    border: '1px solid rgba(245,166,35,0.25)',
                  }}
                >
                  {hcSyncing ? (
                    <>
                      <span className="w-3 h-3 border border-t-[#F5A623] border-[rgba(245,166,35,0.2)] rounded-full animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <SyncIconSvg />
                      Sync Now
                    </>
                  )}
                </button>
                <Link
                  href="/performance/health"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: 'rgba(79,195,247,0.08)',
                    color: '#4FC3F7',
                    border: '1px solid rgba(79,195,247,0.2)',
                  }}
                >
                  View Data
                </Link>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* ── Manual Entry Option ─────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,195,247,0.1)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="2" width="14" height="16" rx="2" />
              <line x1="7" y1="7" x2="13" y2="7" />
              <line x1="7" y1="10" x2="13" y2="10" />
              <line x1="7" y1="13" x2="10" y2="13" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">No Wearable? Use Manual Entry</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              You can manually enter your heart rate in the session Performance tab under "Session Context".
              Use a pulse oximeter or count your pulse for 15 seconds and multiply by 4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <p className="text-[10px] font-display font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="font-mono text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function formatTimeAgoShort(date: Date): string {
  const ms = Date.now() - date.getTime();
  const s  = Math.floor(ms / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function PulseIconSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,12 6,12 8,5 10,19 12,10 14,14 16,12 22,12" />
    </svg>
  );
}

function SyncIconSvg() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,4 1,10 7,10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
