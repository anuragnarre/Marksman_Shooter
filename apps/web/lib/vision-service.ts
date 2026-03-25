/**
 * vision-service.ts
 *
 * Capacitor-aware service that:
 *  1. Captures a high-resolution photo from the native camera (or gallery).
 *  2. Passes the image buffer to the NestJS API, which proxies it to the
 *     FastAPI vision service running the OpenCV + YOLOv8-S pipeline.
 *  3. Returns typed VisionAnalysisResponse results ready for the UI.
 *
 * Camera quality is set to 95 (vs. 88 for thumbnails) so that tiny .22-cal
 * holes at 50m have enough pixels to be detected by YOLO.
 *
 * Scoring constants mirror the Python calibration_engine for client-side use:
 *  - 10m (170 mm card / 1000 px = 0.170 mm/px)
 *  - 25/50m (550 mm card / 1000 px = 0.550 mm/px)
 */

import type { VisionAnalysisResponse, VisionShotResult } from '@shooting-platform/shared-types';

import { apiFetch } from './api';
import { isNative } from './capacitor';

// ---------------------------------------------------------------------------
// Target types
// ---------------------------------------------------------------------------

export type TargetType = 'air_pistol_10m' | 'air_rifle_10m' | 'nr_50m' | 'nr_25m';

/** Physical card sizes in mm, keyed by target type. */
const CARD_SIZE_MM: Record<TargetType, number> = {
  air_pistol_10m: 170,
  air_rifle_10m:  170,
  nr_50m:         550,
  nr_25m:         550,
};

/** ISSF ring widths in mm (radius), keyed by target type. */
const RING_WIDTH_MM: Record<TargetType, number> = {
  air_pistol_10m: 8.0,
  air_rifle_10m:  8.0,
  nr_50m:         25.0,
  nr_25m:         25.0,
};

/** Inner-ten (X-ring) radius in mm, keyed by target type. */
const INNER_TEN_RADIUS_MM: Record<TargetType, number> = {
  air_pistol_10m: 2.5,
  air_rifle_10m:  2.5,
  nr_50m:         12.5,
  nr_25m:         12.5,
};

// ---------------------------------------------------------------------------
// Client-side decimal scoring (mirrors Python calibration_engine)
// ---------------------------------------------------------------------------

export interface DecimalScoreResult {
  score: number;
  isInnerTen: boolean;
  distMm: number;
  distPx: number;
}

/**
 * Calculate the ISSF decimal score for a pixel coordinate on a warped
 * 1000×1000 canvas.  Centre is always (warpSize/2, warpSize/2).
 *
 * Formula:
 *   ratio    = cardSizeMm / warpSize
 *   distPx   = sqrt((x − 500)² + (y − 500)²)
 *   distMm   = distPx × ratio
 *   score    = 10.9 − (distMm / ringWidthMm)  clamped [0, 10.9]
 *
 * @param x           Shot x pixel on warped canvas.
 * @param y           Shot y pixel on warped canvas.
 * @param targetType  Target type string.
 * @param warpSize    Canvas side length in pixels (default 1000).
 */
export function calculateDecimalScore(
  x: number,
  y: number,
  targetType: TargetType,
  warpSize = 1000,
): DecimalScoreResult {
  const centre = warpSize / 2;
  const distPx = Math.sqrt((x - centre) ** 2 + (y - centre) ** 2);
  const ratio  = CARD_SIZE_MM[targetType] / warpSize;
  const distMm = distPx * ratio;

  const raw      = 10.9 - distMm / RING_WIDTH_MM[targetType];
  const score    = Math.round(Math.max(0, Math.min(10.9, raw)) * 10) / 10;
  const isInnerTen = distMm <= INNER_TEN_RADIUS_MM[targetType] + 1e-9;

  return { score, isInnerTen, distMm, distPx };
}

// ---------------------------------------------------------------------------
// Camera capture
// ---------------------------------------------------------------------------

/** Capture a full-quality photo for analysis.  Returns a File or null. */
async function captureAnalysisPhoto(source: 'camera' | 'photos'): Promise<File | null> {
  if (!isNative()) {
    // On web, the caller must provide a File via <input type="file">
    return null;
  }
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const image = await Camera.getPhoto({
      quality: 95,                              // higher quality for analysis
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      correctOrientation: true,
      saveToGallery: false,
    });
    if (!image.base64String) return null;

    const cleanB64 = image.base64String.replace(/^data:[^;]+;base64,/, '');
    const binary   = atob(cleanB64);
    const bytes    = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File(
      [bytes],
      source === 'camera' ? 'target-capture.jpg' : 'target-photo.jpg',
      { type: `image/${image.format ?? 'jpeg'}` },
    );
  } catch (err) {
    const name = err instanceof Error ? err.name : String(err);
    if (name === 'UserCancelledError' || String(err).includes('cancelled')) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Analysis service
// ---------------------------------------------------------------------------

export interface AnalysisOptions {
  /** Target type passed to the vision service. */
  targetType: TargetType;
  /** Session ID to associate detected shots with. */
  sessionId: string;
  /** Photo source — only used when calling from a native Capacitor context. */
  source?: 'camera' | 'photos';
  /** Pre-captured File to send (skips camera capture, used on web). */
  file?: File;
  /** Request annotated debug image from the vision service. */
  debug?: boolean;
}

export interface AnalysisResult {
  /** Shots returned by the vision service, enriched with client-side scores. */
  shots: VisionShotResult[];
  /** Whether the vision service successfully located the target card. */
  targetDetected: boolean;
  /** Server processing time in ms. */
  processingTimeMs: number;
  /** Base64-encoded annotated debug PNG (only when debug=true). */
  debugImageBase64?: string;
  /** The image sent for analysis, as an object URL for overlay rendering. */
  imageObjectUrl: string | null;
}

/**
 * Capture (or accept) a target photo and run the full vision pipeline.
 *
 * Flow:
 *   1. Obtain a File (from camera, gallery, or pre-supplied).
 *   2. POST to NestJS /shots/analyze-photo, which forwards to FastAPI.
 *   3. Enrich each shot with client-side isInnerTen / distMm if missing.
 *   4. Return AnalysisResult for the UI.
 */
export async function analyzeTarget(opts: AnalysisOptions): Promise<AnalysisResult | null> {
  let file: File | null = opts.file ?? null;

  if (!file) {
    file = await captureAnalysisPhoto(opts.source ?? 'camera');
  }
  if (!file) return null;   // user cancelled

  // Build an object URL so the overlay canvas can display the original image
  const imageObjectUrl = URL.createObjectURL(file);

  const form = new FormData();
  form.append('file', file);
  form.append('targetType', opts.targetType);
  if (opts.debug) form.append('debug', 'true');

  const raw = await apiFetch<{
    shots: Array<{
      shot_number: number;
      score: number;
      x: number;
      y: number;
      pixel_x: number;
      pixel_y: number;
      confidence: number;
      is_inner_ten?: boolean;
      dist_mm?: number;
    }>;
    target_detected: boolean;
    processing_time_ms: number;
    debug_image?: string;
  }>(`/shots/analyze-photo?sessionId=${opts.sessionId}`, {
    method: 'POST',
    body: form,
  });

  // Normalise snake_case → camelCase and fill any missing fields
  const shots: VisionShotResult[] = raw.shots.map((s) => ({
    shotNumber: s.shot_number,
    score:      s.score,
    x:          s.x,
    y:          s.y,
    pixelX:     s.pixel_x,
    pixelY:     s.pixel_y,
    confidence: s.confidence,
    isInnerTen: s.is_inner_ten ?? false,
    distMm:     s.dist_mm ?? 0,
  }));

  return {
    shots,
    targetDetected:   raw.target_detected,
    processingTimeMs: raw.processing_time_ms,
    debugImageBase64: raw.debug_image,
    imageObjectUrl,
  };
}

/**
 * Revoke an object URL previously returned in AnalysisResult.imageObjectUrl.
 * Call this when the component that received the result unmounts.
 */
export function revokeImageUrl(url: string | null): void {
  if (url) URL.revokeObjectURL(url);
}
