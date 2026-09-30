# Detection Accuracy & Shot Correction UI — Design Spec

**Date:** 2026-03-30
**Status:** Approved for implementation

---

## Context

The vision detection pipeline is architecturally sound (9-stage OpenCV + optional YOLOv11-L + Mask R-CNN ensemble) but has three critical problems in practice:

1. **No ML models present** — `apps/vision/models/` is empty, so the service runs CV-only mode (the weakest of the three detection methods). Training scripts exist and are ready to use.
2. **EXIF orientation bug** — `cv2.imdecode()` ignores EXIF rotation metadata. WhatsApp phone photos commonly come in with orientation 6 (90° CW), causing the target to appear sideways and detection to fail entirely.
3. **Pixel coordinate bug** — `analyzer.py` lines 186–187 divide `pixel_x/y` by `(work_scale * pre_input_scale)` to "restore to original image space", but `ShotOverlayCanvas.tsx` and `calculateDecimalScore()` both expect coordinates in the 0–1000 warped canvas space. This causes the overlay to be wrong for high-res phone photos.

There is also no way to correct detection errors — `ShotOverlayCanvas` is display-only, no individual shots can be edited after saving.

**Goal:** Fix the detection pipeline to work reliably with real-world phone photos, and add an interactive correction step between analysis and saving so users can drag/add/remove shots before they hit the database.

---

## Architecture

### What changes

| Layer | Change | Scope |
|-------|--------|-------|
| `apps/vision/analyzer.py` | EXIF rotation + pixel coord bug fix + logging | Fixes critical bugs |
| `apps/vision/pipeline/quality_check.py` | Lower blur thresholds for compressed phone JPEGs | Parameter tuning |
| `apps/vision/pipeline/nms.py` | Lower CV solo confidence threshold for CV-only mode | Parameter tuning |
| `apps/vision/pipeline/hole_detector.py` | Relax cream-zone fill ratio base threshold | Parameter tuning |
| `apps/vision/requirements.txt` | Add `Pillow>=10.0.0` explicitly | Dependency |
| `apps/vision/scripts/train_models.sh` | One-time training script (new file) | CLI tooling |
| `apps/web/components/ShotCorrectionCanvas.tsx` | New interactive correction component | New file |
| `apps/web/app/sessions/[id]/page.tsx` | Swap PhotoTab to review-before-save flow | Integration |
| `apps/api/src/shots/shots.controller.ts` | Add `DELETE /shots/:id` and `PATCH /shots/:id` | New endpoints |
| `apps/api/src/shots/shots.service.ts` | Delete and update shot logic | Service |
| `apps/api/src/shots/dto/update-shot.dto.ts` | New DTO for PATCH | New file |

### What does NOT change

- Prisma schema (no new fields needed)
- The 9-stage pipeline architecture
- Scoring formula
- `ShotOverlayCanvas.tsx` (replaced by `ShotCorrectionCanvas` in the photo flow)
- All existing endpoints

---

## Part 1: Vision Pipeline Fixes

### Fix 1 — EXIF Orientation (Critical)

**File:** `apps/vision/analyzer.py`

After `cv2.imdecode()` and before `img_h, img_w = img_bgr.shape[:2]`, apply EXIF rotation:

```python
# EXIF orientation fix — must run before any shape reads
try:
    import io
    from PIL import Image, ExifTags
    pil_img = Image.open(io.BytesIO(image_bytes))
    exif_data = pil_img._getexif()
    if exif_data:
        orientation_key = next(
            (k for k, v in ExifTags.TAGS.items() if v == 'Orientation'), None
        )
        if orientation_key and orientation_key in exif_data:
            o = exif_data[orientation_key]
            if o == 3:
                img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_180)
            elif o == 6:
                img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE)
            elif o == 8:
                img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
            elif o == 2:
                img_bgr = cv2.flip(img_bgr, 1)
            elif o == 4:
                img_bgr = cv2.flip(img_bgr, 0)
            elif o == 5:
                img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE)
                img_bgr = cv2.flip(img_bgr, 1)
            elif o == 7:
                img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
                img_bgr = cv2.flip(img_bgr, 1)
except Exception:
    pass  # Non-fatal: malformed EXIF or non-JPEG format
```

Add `Pillow>=10.0.0` to `requirements.txt`.

Note: Capacitor Camera with `correctOrientation: true` already handles rotation on native. This fix covers web uploads and direct API calls.

### Fix 2 — Pixel Coordinate Bug (Critical)

**File:** `apps/vision/analyzer.py`, lines 186–187

The current code divides pixel coordinates by `(work_scale * pre_input_scale)` to "restore to original image space". But `ShotOverlayCanvas.tsx` and `calculateDecimalScore()` both expect coordinates in the working canvas space (0–1000). Remove the undo:

```python
# Before (buggy — scales coords to original image space):
pixel_x=int(round(s["pixel_x"] / (work_scale * pre_input_scale))),
pixel_y=int(round(s["pixel_y"] / (work_scale * pre_input_scale))),

# After (correct — working canvas space ≈ 0–1000):
pixel_x=s["pixel_x"],
pixel_y=s["pixel_y"],
```

This ensures `ShotOverlayCanvas`, `calculateDecimalScore()`, and the new `ShotCorrectionCanvas` all receive coordinates in the same 0–1000 range.

### Fix 3 — Quality Check Thresholds

**File:** `apps/vision/pipeline/quality_check.py`

WhatsApp JPEG compression reduces Laplacian variance by ~50–65% vs. uncompressed. Lower thresholds while preserving the OR logic:

```python
BLUR_THRESHOLD      = 40.0    # was 100.0
TENENGRAD_THRESHOLD = 200.0   # was 500.0
```

The blur check is advisory (doesn't hard-reject), so this only reduces false warnings.

### Fix 4 — CV Detection Thresholds

**File:** `apps/vision/pipeline/nms.py`

In CV-only mode (no YOLO), the CV solo threshold at 0.42 is too strict. The fill-ratio and radial-gradient checks in `hole_detector.py` are the primary false-positive suppressors; the NMS threshold can safely drop back:

```python
CV_SOLO_THRESHOLD = 0.35   # was 0.42
```

**File:** `apps/vision/pipeline/hole_detector.py`

Relax the base cream-zone fill ratio for compressed phone images (near-ring stricter thresholds unchanged):

```python
fill_min = 0.22 if bright else 0.38   # was 0.22 / 0.45
```

### Fix 5 — Structured Logging

**File:** `apps/vision/analyzer.py` and `apps/vision/main.py`

Add `import logging` and log each pipeline stage at DEBUG level (stage name, detection count, confidence), plus INFO-level summary per request. Use `logging.basicConfig(level=logging.INFO)` in `main.py`. No new dependencies.

### Fix 6 — YOLO Training Script (CLI, one-time)

**File:** `apps/vision/scripts/train_models.sh` (new file)

Wraps `train_yolo11.py` with the real images from `shoot/` as unlabeled training examples:

```bash
#!/usr/bin/env bash
set -euo pipefail
REAL_IMAGES="${1:-../../shoot}"
cd "$(dirname "$0")/.."
pip install ultralytics>=8.3.0
python scripts/train_yolo11.py \
  --real-images "$REAL_IMAGES" \
  --export \
  --output models/shot_detector_yolo11l.pt
echo "Done. Restart vision service to load YOLO model."
```

After training, restart the vision service. The ONNX file loads automatically via the existing graceful model-loading logic.

---

## Part 2: Shot Correction UI

### New component: `ShotCorrectionCanvas.tsx`

**File:** `apps/web/components/ShotCorrectionCanvas.tsx`

Replaces `ShotOverlayCanvas` in the photo analysis flow with an interactive version.

#### Layout

```
<div style="position: relative">
  <img ref={imgRef} src={imageObjectUrl} style="object-fit: contain; max-height: 60vh" />
  <canvas ref={canvasRef} style="position: absolute; top: imgTop; left: imgLeft;
                                   width: imgW; height: imgH; cursor: ..." />
</div>
<toolbar>  [Move] [+ Add] [× Remove selected] [↩ Undo]  </toolbar>
<shot-list>  per-shot score + delete button  </shot-list>
<action-bar>  [Re-analyse] [✓ Save to session]  </action-bar>
```

The `<img>` handles natural image rendering (EXIF, aspect ratio). The `<canvas>` is an absolute overlay sized and positioned to exactly cover the rendered image via `ResizeObserver`.

#### Props

```typescript
interface ShotCorrectionCanvasProps {
  imageObjectUrl: string;
  shots: VisionShotResult[];        // initial detections
  targetType: TargetType;
  onConfirm: (shots: VisionShotResult[]) => void;
  onCancel: () => void;
}
```

#### State

```typescript
shots: VisionShotResult[]           // working copy (mutable)
history: VisionShotResult[][]       // undo stack (max 50 entries)
mode: 'move' | 'add'
selected: number | null             // selected shot index
dragging: number | null             // shot index being dragged
imgRect: { w: number; h: number; top: number; left: number }
hoverPos: { x: number; y: number } | null  // for add-mode cursor crosshair
```

#### Coordinate transform

`pixelX/Y` is in 0–1000 warped canvas space (after Fix 2). The rendered image may be narrower/taller than 1000px. Convert:

```typescript
// warp → display pixels (relative to canvas top-left)
function warpToDisplay(px: number, py: number): [number, number] {
  return [px * (imgRect.w / 1000), py * (imgRect.h / 1000)];
}

// display pixels → warp space
function displayToWarp(dx: number, dy: number): [number, number] {
  return [dx * (1000 / imgRect.w), dy * (1000 / imgRect.h)];
}
```

Use `useLayoutEffect` + `ResizeObserver` on the `<img>` element to track `imgRect`. The canvas is sized and repositioned on every `imgRect` change.

#### Pointer interactions

Follows the same pattern as `InteractiveTab` (pointer capture, DRAG_THRESHOLD=5px):

- **Move mode, pointerdown on dot** → start drag with `setPointerCapture`
- **Move mode, pointermove while dragging** → update `shots[dragging].pixelX/Y`, call `recalcScore()`
- **Move mode, pointerup** → commit to history, clear dragging
- **Move mode, pointerdown on empty** → select nearest shot if within 20px
- **Add mode, click** → push to history, add new shot at `displayToWarp(x, y)` with recalculated score
- **Right-click (contextmenu)** → `e.preventDefault()`, if hit on dot: push history, remove shot
- **Keyboard `Delete`** → remove selected shot
- **Ctrl+Z** → pop history

#### Score recalculation

```typescript
import { calculateDecimalScore } from '../lib/vision-service';

function recalcScore(pixelX: number, pixelY: number) {
  return calculateDecimalScore(pixelX, pixelY, props.targetType);
}
```

#### Canvas draw

`useEffect` on `[shots, dragging, selected, imgRect, mode, hoverPos]`:

1. Clear canvas
2. Draw center crosshair at `warpToDisplay(500, 500)` (amber, faint)
3. For each shot: draw dot at `warpToDisplay(shot.pixelX, shot.pixelY)` with score-based color (gold/blue/green/red per design system), inner label with shot number, white outline ring
4. Selected dot: larger with selection ring + glow
5. Dragging dot: largest with animated halo + live score tooltip
6. Low-confidence shots (< 0.6): dashed border + warning indicator
7. Add mode: draw crosshair at `hoverPos` when not hovering a shot

#### Low-confidence flagging

Shots with `confidence < 0.6` are shown with a dashed circle border and an amber warning triangle drawn in canvas, plus an "⚠ low conf" badge in the shot list panel.

### PhotoTab integration

**File:** `apps/web/app/sessions/[id]/page.tsx` (PhotoTab section)

#### New state: `step`

```typescript
type PhotoStep = 'idle' | 'uploading' | 'reviewing' | 'saving' | 'done' | 'error';
const [step, setStep] = useState<PhotoStep>('idle');
const [pendingShots, setPendingShots] = useState<VisionShotResult[]>([]);
const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
```

#### New flow

```
handleFile(file)
  → setStep('uploading')
  → POST /shots/analyze-photo?sessionId=&targetType=&save=false   ← new ?save=false
  → setPendingShots(result.shots)
  → setPendingImageUrl(result.imageObjectUrl)
  → setStep('reviewing')

When step === 'reviewing':
  <ShotCorrectionCanvas
    imageObjectUrl={pendingImageUrl}
    shots={pendingShots}
    targetType={targetType}
    onConfirm={handleConfirm}
    onCancel={() => { setStep('idle'); revokeImageUrl(pendingImageUrl); }}
  />

handleConfirm(correctedShots):
  → setStep('saving')
  → POST /shots/manual  { sessionId, shots: correctedShots.map(toShotEntry) }
  → setStep('done')
  → revokeImageUrl(pendingImageUrl)
  → refresh session after 1.5s
```

#### Backend: add `?save=false` to `POST /shots/analyze-photo`

**File:** `apps/api/src/shots/shots.controller.ts`

Add `@Query('save') save?: string` parameter. When `save === 'false'`, skip `createShots` and return only the vision results. The existing `analyzePhotoFull` service method gets a `persist: boolean` flag.

---

## Part 3: API Additions

### `DELETE /shots/:id`

Access control: shooter owns session, or coach has approved connection.
Side effect: emit `session.updated` WebSocket event.
Response: `{ deleted: true }`.

### `PATCH /shots/:id`

Body: `UpdateShotDto { x?: number; y?: number }` (both optional, ±15mm range).
Service recalculates `score` server-side from new x, y using the ISSF formula.
Note: x/y in DB are mm from center (not 0–1000 pixel space). Client must convert before calling this endpoint. For the correction canvas flow, `POST /shots/manual` is used instead (simpler, no conversion needed).

**New file:** `apps/api/src/shots/dto/update-shot.dto.ts`

---

## Verification

1. **EXIF fix**: Upload one of the `shoot/` WhatsApp images via the photo tab. Shots should now be detected (previously none due to 90° rotation). Check `/health` endpoint to confirm `detector: "cv-v6-..."`.
2. **Pixel coord fix**: After uploading a photo, the shot dots in the overlay/correction canvas should align with actual holes in the photo (previously off for high-res photos).
3. **Threshold fixes**: Run `python test_pipeline.py` from `apps/vision/` against `shoot/` images. Compare shot counts before/after.
4. **Correction canvas**: After photo analysis, the review step appears. Drag shot 1 — score updates live. Add a new shot by clicking empty area. Remove the lowest-confidence shot. Click "Save to session" — shots appear in session with corrected positions.
5. **API endpoints**: `DELETE /shots/:id` removes a single shot without deleting the session. `PATCH /shots/:id` updates x/y and recalculates score.
6. **YOLO training** (optional, run separately): `bash apps/vision/scripts/train_models.sh` generates `models/shot_detector_yolo11l.onnx`. After restart, `/health` shows `yolo_loaded: true`. Re-run test_pipeline.py — shot counts should improve.

---

## Implementation Order

1. Vision fixes (analyzer.py, quality_check.py, nms.py, hole_detector.py, requirements.txt)
2. Training script (scripts/train_models.sh)
3. API additions (update-shot.dto.ts, shots.controller.ts, shots.service.ts)
4. ShotCorrectionCanvas.tsx (standalone, no page dependencies)
5. PhotoTab integration (page.tsx) — requires both API additions and new component
