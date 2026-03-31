#!/usr/bin/env python3
"""
Quick smoke-test for the running vision service.

Usage:
    python scripts/test_service.py                      # synthetic only
    python scripts/test_service.py path/to/image.jpg   # also test a real image

Reports whether:
  - The service is reachable
  - It is running v6.1+ (with the resize fix)
  - A synthetic test image produces at least one shot
"""

import sys
import io
import json
import struct
import zlib
import urllib.request
import urllib.error

BASE = "http://localhost:8000"


def _make_test_png(width: int = 200, height: int = 200) -> bytes:
    """Create a minimal PNG with a white circle on grey background (fake target)."""
    import array
    pixels = []
    cx, cy = width // 2, height // 2
    r = width // 3
    for y in range(height):
        row = []
        for x in range(width):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if dist < r * 0.15:
                row += [200, 200, 200]   # grey center
            elif dist < r * 0.3:
                row += [50, 50, 50]      # black inner ring
            elif dist < r * 0.5:
                row += [200, 200, 200]   # grey outer
            elif dist < r * 0.7:
                row += [50, 50, 50]      # black outer ring
            elif dist < r:
                row += [200, 200, 200]
            else:
                row += [230, 230, 220]   # cream background
        pixels.append(bytes(row))

    def png_chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b""
    for row in pixels:
        raw += b"\x00" + row  # filter byte per row

    compressed = zlib.compress(raw, 9)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (sig
            + png_chunk(b"IHDR", ihdr_data)
            + png_chunk(b"IDAT", compressed)
            + png_chunk(b"IEND", b""))


def check_health():
    print("1. Health check ...")
    try:
        with urllib.request.urlopen(f"{BASE}/health", timeout=5) as r:
            data = json.loads(r.read())
    except urllib.error.URLError as e:
        print(f"   FAIL — service not reachable: {e}")
        print("\n>>> Restart the vision service:")
        print("    cd apps/vision && uvicorn main:app --reload --port 8000")
        return False

    print(f"   status       : {data.get('status')}")
    print(f"   version      : {data.get('version', 'UNKNOWN — old build!')}")
    print(f"   max_input_dim: {data.get('max_input_dim', 'MISSING — old build!')}")
    print(f"   max_work_dim : {data.get('max_work_dim',  'MISSING — old build!')}")
    print(f"   yolo_loaded  : {data.get('yolo_loaded')}")

    if "max_input_dim" not in data:
        print("\n   WARNING: Service is running old code (missing resize fix).")
        print("   >>> Stop and restart: uvicorn main:app --reload --port 8000\n")
        return False

    print("   OK\n")
    return True


def analyze_image(image_bytes: bytes, label: str):
    print(f"2. Analyze {label} ...")

    boundary = b"boundary123"
    body = (
        b"--" + boundary + b"\r\n"
        b'Content-Disposition: form-data; name="file"; filename="test.png"\r\n'
        b"Content-Type: image/png\r\n\r\n"
        + image_bytes
        + b"\r\n--" + boundary + b"--\r\n"
    )
    req = urllib.request.Request(
        f"{BASE}/analyze?target_type=air_rifle_10m",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary.decode()}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        print(f"   FAIL — HTTP {e.code}: {body_text[:200]}")
        return

    shots = data.get("shots", [])
    elapsed = data.get("processing_time_ms", 0)
    detected = data.get("target_detected", False)

    print(f"   target_detected   : {detected}")
    print(f"   shots returned    : {len(shots)}")
    print(f"   processing_time_ms: {elapsed:.0f}")

    if elapsed > 10000:
        print("   WARNING: Processing > 10s — likely running without resize fix.")
        print("   >>> Stop and restart: uvicorn main:app --reload --port 8000")

    for s in shots[:5]:
        print(f"     shot #{s['shot_number']}: score={s['score']} "
              f"pixel=({s['pixel_x']},{s['pixel_y']}) conf={s['confidence']:.2f}")

    if not shots:
        print("   FAIL: No shots detected — check service logs for Stage 4/5 lines.")
    else:
        print("   OK\n")


if __name__ == "__main__":
    ok = check_health()
    if not ok:
        sys.exit(1)

    # Always test with a synthetic PNG
    analyze_image(_make_test_png(), "synthetic target (PNG, 200×200)")

    # If a real image path was provided, test that too
    if len(sys.argv) > 1:
        path = sys.argv[1]
        try:
            with open(path, "rb") as f:
                img_bytes = f.read()
            analyze_image(img_bytes, f"real image: {path}")
        except FileNotFoundError:
            print(f"Image not found: {path}")
