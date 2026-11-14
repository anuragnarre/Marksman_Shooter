import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { AudioReading, CalibrationCorners, CvFrameStats, OrientationReading } from '../types/target';

const { TargetHardware } = NativeModules;

const emitter = TargetHardware ? new NativeEventEmitter(TargetHardware) : null;

export interface PreviewFrameCapture {
  base64: string;
  width: number;
  height: number;
}

export interface DetectedBoundsResult {
  found: boolean;
  reason?: string;
  contrastRange?: number;
  confidence?: number;
  topLeft?: { x: number; y: number };
  topRight?: { x: number; y: number };
  bottomRight?: { x: number; y: number };
  bottomLeft?: { x: number; y: number };
}

export function isNativeHardwareAvailable(): boolean {
  return Platform.OS === 'android' && Boolean(TargetHardware);
}

export function normalizeCornersForView(
  corners: CalibrationCorners,
  viewWidth: number,
  viewHeight: number
) {
  const safeW = Math.max(1, viewWidth);
  const safeH = Math.max(1, viewHeight);
  return {
    topLeft: { x: corners.topLeft.x / safeW, y: corners.topLeft.y / safeH },
    topRight: { x: corners.topRight.x / safeW, y: corners.topRight.y / safeH },
    bottomRight: { x: corners.bottomRight.x / safeW, y: corners.bottomRight.y / safeH },
    bottomLeft: { x: corners.bottomLeft.x / safeW, y: corners.bottomLeft.y / safeH },
  };
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (already) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'Marksman Target Camera uses your microphone for live dB SPL monitoring and acoustic shot detection.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function hasMicrophonePermission(): Promise<boolean> {
  if (!TargetHardware?.hasAudioPermission) return false;
  try {
    return await TargetHardware.hasAudioPermission();
  } catch {
    return false;
  }
}

export async function startOrientationMonitoring(): Promise<boolean> {
  if (!TargetHardware?.startOrientationMonitoring) return false;
  try {
    return await TargetHardware.startOrientationMonitoring();
  } catch {
    return false;
  }
}

export function stopOrientationMonitoring(): void {
  try {
    TargetHardware?.stopOrientationMonitoring?.();
  } catch {
    // Ignore
  }
}

export function subscribeOrientation(cb: (reading: OrientationReading) => void): () => void {
  if (!emitter) return () => {};
  const sub = emitter.addListener('targetHardwareOrientation', cb);
  return () => sub.remove();
}

export async function startAudioMonitoring(): Promise<boolean> {
  if (!TargetHardware?.startAudioMonitoring) return false;
  try {
    return await TargetHardware.startAudioMonitoring();
  } catch {
    return false;
  }
}

export function stopAudioMonitoring(): void {
  try {
    TargetHardware?.stopAudioMonitoring?.();
  } catch {
    // Ignore
  }
}

export function subscribeAudio(cb: (reading: AudioReading) => void): () => void {
  if (!emitter) return () => {};
  const sub = emitter.addListener('targetHardwareAudio', cb);
  return () => sub.remove();
}

export async function capturePreviewBase64(
  maxWidth: number = 480,
  jpegQuality: number = 50
): Promise<PreviewFrameCapture | null> {
  if (!TargetHardware?.capturePreviewBase64) return null;
  try {
    return await TargetHardware.capturePreviewBase64(maxWidth, jpegQuality);
  } catch {
    return null;
  }
}

export async function analyzeLivePreview(
  corners: CalibrationCorners,
  viewWidth: number,
  viewHeight: number,
  mode: 'SET_BASELINE' | 'SCAN_DELTA' | 'METRICS_ONLY',
  deltaThreshold: number = 28
): Promise<(CvFrameStats & { previewUnavailable?: boolean }) | null> {
  if (!TargetHardware?.analyzeLivePreview) return null;
  try {
    const norm = normalizeCornersForView(corners, viewWidth, viewHeight);
    return await TargetHardware.analyzeLivePreview(norm, mode, deltaThreshold);
  } catch {
    return null;
  }
}

export async function analyzeBase64Frame(
  base64Jpeg: string,
  corners: CalibrationCorners,
  viewWidth: number,
  viewHeight: number,
  mode: 'SET_BASELINE' | 'SCAN_DELTA' | 'METRICS_ONLY',
  deltaThreshold: number = 28
): Promise<(CvFrameStats & { previewUnavailable?: boolean }) | null> {
  if (!TargetHardware?.analyzeBase64Frame) return null;
  try {
    const norm = normalizeCornersForView(corners, viewWidth, viewHeight);
    return await TargetHardware.analyzeBase64Frame(base64Jpeg, norm, mode, deltaThreshold);
  } catch {
    return null;
  }
}

export async function resetCvBaseline(): Promise<void> {
  try {
    TargetHardware?.resetCvBaseline?.();
  } catch {
    // Ignore
  }
}

export async function findTargetBoundsFromCamera(
  viewWidth: number,
  viewHeight: number
): Promise<DetectedBoundsResult & { corners?: CalibrationCorners }> {
  if (!TargetHardware?.findTargetBounds) return { found: false, reason: 'NATIVE_UNAVAILABLE' };
  try {
    const res: DetectedBoundsResult = await TargetHardware.findTargetBounds();
    if (!res?.found || !res.topLeft || !res.topRight || !res.bottomRight || !res.bottomLeft) {
      return res;
    }
    return {
      ...res,
      corners: {
        topLeft: { x: res.topLeft.x * viewWidth, y: res.topLeft.y * viewHeight },
        topRight: { x: res.topRight.x * viewWidth, y: res.topRight.y * viewHeight },
        bottomRight: { x: res.bottomRight.x * viewWidth, y: res.bottomRight.y * viewHeight },
        bottomLeft: { x: res.bottomLeft.x * viewWidth, y: res.bottomLeft.y * viewHeight },
        isCalibrated: true,
      },
    };
  } catch {
    return { found: false, reason: 'NATIVE_ERROR' };
  }
}
