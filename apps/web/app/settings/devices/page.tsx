// apps/web/app/settings/devices/page.tsx
'use client';

import { AppShell } from '../../../components/AppShell';
import { DeviceManager } from '../../../components/DeviceManager';

export default function DeviceSettingsPage() {
  return (
    <AppShell title="Device Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-lg text-[#F0F4FF] mb-1">
            Connect a Device
          </h2>
          <p className="text-sm" style={{ color: '#8892A4' }}>
            Track your heart rate and SpO2 during shooting sessions using one of the options below.
          </p>
        </div>

        {/* How it works overview */}
        <div className="card p-5">
          <p className="font-display font-semibold text-sm text-[#F0F4FF] mb-3">How Biometric Tracking Works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.1)' }}>
                <span className="font-display font-bold text-sm" style={{ color: '#F5A623' }}>1</span>
              </div>
              <p className="text-xs font-semibold text-[#F0F4FF]">Connect Device</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8892A4' }}>
                Register your Arduino sensor or connect Health Connect on Android
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,195,247,0.1)' }}>
                <span className="font-display font-bold text-sm" style={{ color: '#4FC3F7' }}>2</span>
              </div>
              <p className="text-xs font-semibold text-[#F0F4FF]">Data Streams In</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8892A4' }}>
                HR and SpO2 automatically link to your active shooting session
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,160,0.1)' }}>
                <span className="font-display font-bold text-sm" style={{ color: '#00E5A0' }}>3</span>
              </div>
              <p className="text-xs font-semibold text-[#F0F4FF]">AI Correlates</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8892A4' }}>
                See how heart rate affects your shot accuracy with AI analysis
              </p>
            </div>
          </div>
        </div>

        <DeviceManager />

        {/* Arduino Setup Guide */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-base text-[#F0F4FF] mb-3">
            Arduino Sensor Setup
          </h3>
          <p className="text-xs mb-3" style={{ color: '#8892A4' }}>
            Using a MAX30105 pulse oximeter with ESP32? Follow these steps:
          </p>
          <ol className="space-y-3 text-sm" style={{ color: '#8892A4' }}>
            <li className="flex gap-3">
              <span className="font-mono text-xs font-bold shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>1</span>
              <div>
                <p className="text-[#F0F4FF] font-semibold text-xs">Register your device above</p>
                <p className="text-[10px]">Click "+ Register Arduino Sensor", give it a name. Copy the API key that appears.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs font-bold shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>2</span>
              <div>
                <p className="text-[#F0F4FF] font-semibold text-xs">Paste the key in your Arduino code</p>
                <p className="text-[10px]">Find this line in the sketch and paste your key:</p>
                <code className="font-mono text-[10px] block mt-1 px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#F5A623' }}>
                  #define DEVICE_API_KEY "paste-your-64-char-key-here"
                </code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs font-bold shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>3</span>
              <div>
                <p className="text-[#F0F4FF] font-semibold text-xs">Upload to your ESP32</p>
                <p className="text-[10px]">The firmware already sends data to the platform. The key authenticates your device.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs font-bold shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>4</span>
              <div>
                <p className="text-[#F0F4FF] font-semibold text-xs">Verify connection</p>
                <p className="text-[10px]">Power on the sensor, click your device above, and hit "Test Connection" to confirm data is flowing.</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
