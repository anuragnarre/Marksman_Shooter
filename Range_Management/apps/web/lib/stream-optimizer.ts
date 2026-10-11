// apps/web/lib/stream-optimizer.ts
import {
  CameraStreamConfig,
  StreamProfilePreset,
  StreamTelemetryMetrics,
} from '@shooting-platform/shared-types';

export const STREAM_PRESETS: Record<StreamProfilePreset, CameraStreamConfig> = {
  AUTO_ADAPTIVE: {
    profile: 'AUTO_ADAPTIVE',
    resolution: '720p',
    targetFps: 30,
    bitrateCapKbps: 2200,
    qualityFactor: 0.50,
    protocol: 'WEBSOCKET_BINARY',
    hardwareAcceleration: 'WEBGL2',
    congestionPolicy: 'ADAPTIVE_DOWNSCALE',
    jitterBufferMs: 60,
    keyframeIntervalSec: 1.0,
    autoExposureLock: true,
    auxTorchEnabled: false,
    thermalThrottleTempC: 43,
  },
  LAN_ULTRA_LOW_LAT: {
    profile: 'LAN_ULTRA_LOW_LAT',
    resolution: '1080p',
    targetFps: 60,
    bitrateCapKbps: 6000,
    qualityFactor: 0.80,
    protocol: 'WEBSOCKET_BINARY',
    hardwareAcceleration: 'WEBGL2',
    congestionPolicy: 'DROP_LATE',
    jitterBufferMs: 0,
    keyframeIntervalSec: 0.5,
    autoExposureLock: true,
    auxTorchEnabled: false,
    thermalThrottleTempC: 45,
  },
  BALANCED_WIRELESS: {
    profile: 'BALANCED_WIRELESS',
    resolution: '720p',
    targetFps: 30,
    bitrateCapKbps: 2500,
    qualityFactor: 0.55,
    protocol: 'WEBSOCKET_BINARY',
    hardwareAcceleration: 'WEBGL2',
    congestionPolicy: 'SMOOTH_JITTER',
    jitterBufferMs: 50,
    keyframeIntervalSec: 1.0,
    autoExposureLock: true,
    auxTorchEnabled: false,
    thermalThrottleTempC: 42,
  },
  BANDWIDTH_SAVER: {
    profile: 'BANDWIDTH_SAVER',
    resolution: '480p',
    targetFps: 15,
    bitrateCapKbps: 800,
    qualityFactor: 0.35,
    protocol: 'WEBSOCKET_BINARY',
    hardwareAcceleration: 'CANVAS_2D',
    congestionPolicy: 'DROP_LATE',
    jitterBufferMs: 100,
    keyframeIntervalSec: 2.0,
    autoExposureLock: false,
    auxTorchEnabled: false,
    thermalThrottleTempC: 40,
  },
  ECO_BATTERY: {
    profile: 'ECO_BATTERY',
    resolution: '360p',
    targetFps: 10,
    bitrateCapKbps: 400,
    qualityFactor: 0.28,
    protocol: 'WEBSOCKET_BINARY',
    hardwareAcceleration: 'CANVAS_2D',
    congestionPolicy: 'DROP_LATE',
    jitterBufferMs: 150,
    keyframeIntervalSec: 2.5,
    autoExposureLock: false,
    auxTorchEnabled: false,
    thermalThrottleTempC: 38,
  },
  CUSTOM: {
    profile: 'CUSTOM',
    resolution: '720p',
    targetFps: 30,
    bitrateCapKbps: 2500,
    qualityFactor: 0.50,
    protocol: 'WEBSOCKET_BINARY',
    hardwareAcceleration: 'WEBGL2',
    congestionPolicy: 'SMOOTH_JITTER',
    jitterBufferMs: 50,
    keyframeIntervalSec: 1.0,
    autoExposureLock: true,
    auxTorchEnabled: false,
    thermalThrottleTempC: 42,
  },
};

const STORAGE_KEY_PREFIX = 'marksman_stream_config_';

export function loadStreamConfig(laneId: string = 'global'): CameraStreamConfig {
  if (typeof window === 'undefined') return { ...STREAM_PRESETS.AUTO_ADAPTIVE };
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${laneId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const profileKey = (parsed.profile as StreamProfilePreset) || 'AUTO_ADAPTIVE';
      const basePreset = STREAM_PRESETS[profileKey] || STREAM_PRESETS.AUTO_ADAPTIVE;
      return { ...basePreset, ...parsed };
    }
  } catch (err) {
    console.warn('Could not read stored stream config:', err);
  }
  return { ...STREAM_PRESETS.AUTO_ADAPTIVE };

}

export function saveStreamConfig(config: CameraStreamConfig, laneId: string = 'global'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${laneId}`, JSON.stringify(config));
  } catch (err) {
    console.warn('Could not save stream config:', err);
  }
}

/**
 * Real-time Telemetry & ABR Controller
 */
export class StreamTelemetryTracker {
  private frameTimestamps: number[] = [];
  private rttSamples: number[] = [];
  private totalBytesReceived = 0;
  private lastByteCheckTime = Date.now();
  private currentBandwidthKbps = 0;
  private droppedFrames = 0;
  private totalExpectedFrames = 0;
  private lastFrameSeq = -1;

  public registerFrame(byteSize: number = 0, frameSeq?: number): void {
    const now = Date.now();
    this.frameTimestamps.push(now);
    this.totalBytesReceived += byteSize;

    // Remove frame timestamps older than 2 seconds
    this.frameTimestamps = this.frameTimestamps.filter((t) => now - t <= 2000);

    // Track sequence drops
    if (typeof frameSeq === 'number') {
      if (this.lastFrameSeq >= 0) {
        const gap = frameSeq - this.lastFrameSeq - 1;
        if (gap > 0) {
          this.droppedFrames += gap;
          this.totalExpectedFrames += gap + 1;
        } else {
          this.totalExpectedFrames += 1;
        }
      } else {
        this.totalExpectedFrames += 1;
      }
      this.lastFrameSeq = frameSeq;
    }

    // Update bandwidth calculation every 1000ms
    const elapsed = now - this.lastByteCheckTime;
    if (elapsed >= 1000) {
      this.currentBandwidthKbps = Math.round((this.totalBytesReceived * 8) / (elapsed / 1000) / 1000);
      this.totalBytesReceived = 0;
      this.lastByteCheckTime = now;
    }
  }

  public registerRtt(rttMs: number): void {
    this.rttSamples.push(rttMs);
    if (this.rttSamples.length > 10) {
      this.rttSamples.shift();
    }
  }

  public getMetrics(targetFps: number, profile: StreamProfilePreset): StreamTelemetryMetrics {
    const now = Date.now();
    const recentFrames = this.frameTimestamps.filter((t) => now - t <= 1000).length;
    const currentFps = recentFrames;

    // Calculate Average RTT & Jitter
    const avgRtt = this.rttSamples.length > 0
      ? Math.round(this.rttSamples.reduce((a, b) => a + b, 0) / this.rttSamples.length)
      : 18;

    let jitter = 0;
    if (this.rttSamples.length > 1) {
      const deviations = this.rttSamples.map((s) => Math.abs(s - avgRtt));
      jitter = Math.round(deviations.reduce((a, b) => a + b, 0) / deviations.length);
    }

    const dropRatePercent = this.totalExpectedFrames > 0
      ? Math.min(100, Math.round((this.droppedFrames / this.totalExpectedFrames) * 100))
      : 0;

    let networkQuality: StreamTelemetryMetrics['networkQuality'] = 'EXCELLENT';
    if (avgRtt > 180 || dropRatePercent > 12) {
      networkQuality = 'POOR';
    } else if (avgRtt > 90 || dropRatePercent > 4) {
      networkQuality = 'FAIR';
    } else if (avgRtt > 45 || dropRatePercent > 1) {
      networkQuality = 'GOOD';
    }

    return {
      currentFps,
      targetFps,
      rttMs: avgRtt,
      jitterMs: jitter,
      bandwidthKbps: this.currentBandwidthKbps,
      droppedFramesCount: this.droppedFrames,
      dropRatePercent,
      networkQuality,
      isThrottled: dropRatePercent > 10 || avgRtt > 150,
      activeProfile: profile,
      timestamp: now,
    };
  }

  public computeAdaptiveAdjustment(
    currentConfig: CameraStreamConfig,
    metrics: StreamTelemetryMetrics
  ): Partial<CameraStreamConfig> | null {
    if (currentConfig.profile !== 'AUTO_ADAPTIVE') return null;

    // Downscale if network is struggling
    if (metrics.networkQuality === 'POOR' || metrics.dropRatePercent > 8) {
      if (currentConfig.resolution === '1080p') {
        return { resolution: '720p', targetFps: 24, qualityFactor: 0.45, bitrateCapKbps: 1800 };
      }
      if (currentConfig.resolution === '720p') {
        return { resolution: '480p', targetFps: 18, qualityFactor: 0.35, bitrateCapKbps: 900 };
      }
      if (currentConfig.resolution === '480p' && currentConfig.targetFps > 12) {
        return { targetFps: 12, qualityFactor: 0.28, bitrateCapKbps: 500 };
      }
    }

    // Upscale if network is excellent with zero drops
    if (metrics.networkQuality === 'EXCELLENT' && metrics.rttMs < 35 && metrics.dropRatePercent === 0) {
      if (currentConfig.resolution === '480p') {
        return { resolution: '720p', targetFps: 30, qualityFactor: 0.55, bitrateCapKbps: 2200 };
      }
      if (currentConfig.resolution === '720p' && currentConfig.targetFps < 45) {
        return { targetFps: 45, qualityFactor: 0.65, bitrateCapKbps: 3500 };
      }
    }

    return null;
  }
}
