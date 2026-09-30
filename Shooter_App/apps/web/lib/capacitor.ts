// lib/capacitor.ts
// Capacitor native bridge utilities — all functions degrade gracefully on web.

import { Capacitor } from '@capacitor/core';

// ── Environment detection ─────────────────────────────────────────────────────

export const isNative   = (): boolean => Capacitor.isNativePlatform();
export const isAndroid  = (): boolean => Capacitor.getPlatform() === 'android';
export const isIOS      = (): boolean => Capacitor.getPlatform() === 'ios';
export const isWeb      = (): boolean => Capacitor.getPlatform() === 'web';

// ── Camera ────────────────────────────────────────────────────────────────────

export type PhotoSource = 'camera' | 'photos';

/** Returns a File ready to POST, or null if cancelled/denied. */
export async function getNativePhoto(source: PhotoSource): Promise<File | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const image = await Camera.getPhoto({
      quality: 88,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      correctOrientation: true,
      saveToGallery: false,
    });
    if (!image.base64String) return null;
    return base64ToFile(
      image.base64String,
      source === 'camera' ? 'camera-capture.jpg' : 'gallery-photo.jpg',
      `image/${image.format ?? 'jpeg'}`,
    );
  } catch (err) {
    // User cancelled or permission denied — treat as null, not an error
    const name = err instanceof Error ? err.name : String(err);
    if (name === 'UserCancelledError' || String(err).includes('cancelled')) return null;
    throw err;
  }
}

/** Request camera permission — returns whether granted. */
export async function requestCameraPermission(): Promise<boolean> {
  if (!isNative()) return true; // web handles its own permission flow
  try {
    const { Camera } = await import('@capacitor/camera');
    const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    return (
      status.camera === 'granted' || status.camera === 'limited' ||
      status.photos === 'granted' || status.photos === 'limited'
    );
  } catch {
    return false;
  }
}

function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
  const binary  = atob(cleanBase64);
  const bytes   = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}

// ── Status Bar ────────────────────────────────────────────────────────────────

export async function initStatusBar(): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#080A0F' });
      await StatusBar.setOverlaysWebView({ overlay: true });
    }
  } catch { /* non-fatal */ }
}

// ── Splash Screen ─────────────────────────────────────────────────────────────

export async function hideSplashScreen(): Promise<void> {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch { /* non-fatal */ }
}

// ── Haptics ───────────────────────────────────────────────────────────────────

export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* non-fatal */ }
}

export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* non-fatal */ }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* non-fatal */ }
}

export async function hapticError(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Error });
  } catch { /* non-fatal */ }
}

// ── Network ───────────────────────────────────────────────────────────────────

export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

export interface NetworkStatus {
  connected: boolean;
  connectionType: ConnectionType;
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!isNative()) {
    return { connected: navigator.onLine, connectionType: 'unknown' };
  }
  try {
    const { Network } = await import('@capacitor/network');
    const s = await Network.getStatus();
    return { connected: s.connected, connectionType: s.connectionType as ConnectionType };
  } catch {
    return { connected: true, connectionType: 'unknown' };
  }
}
