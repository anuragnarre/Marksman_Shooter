"""
engine/start.py — Marksman Range Engine Entrypoint

Usage:
  python start.py                     # uses engine/config.yaml
  python start.py --config my.yaml    # custom config path
  python start.py --target air_rifle_10m --camera 0  # CLI overrides
  python start.py --check             # health check only, then exit
"""

import argparse
import logging
import sys
import os
from pathlib import Path


def setup_logging(level: str = "INFO", log_file: str = "") -> None:
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    handlers = [logging.StreamHandler(sys.stdout)]
    if log_file:
        handlers.append(logging.FileHandler(log_file))
    logging.basicConfig(level=getattr(logging, level.upper(), logging.INFO),
                        format=fmt, handlers=handlers)


def load_config(path: str) -> dict:
    import yaml
    with open(path, "r") as f:
        return yaml.safe_load(f)


def health_check(vision_url: str, api_url: str) -> None:
    import httpx

    print("\n── Marksman Range Engine — Health Check ─────────────────────")

    # Vision service
    try:
        r = httpx.get(f"{vision_url}/health", timeout=5.0)
        data = r.json()
        print(f"  ✅ Vision service  {vision_url}")
        print(f"     version={data.get('version')}  yolo={data.get('yolo_loaded')}  "
              f"targets={len(data.get('supported_targets', {}))}")
    except Exception as e:
        print(f"  ❌ Vision service  {vision_url}  ({e})")

    # API server
    try:
        r = httpx.get(f"{api_url}/health", timeout=5.0)
        print(f"  ✅ API server      {api_url}")
    except httpx.HTTPStatusError as e:
        if e.response.status_code in (401, 403):
            print(f"  ✅ API server      {api_url}  (auth required — expected)")
        else:
            print(f"  ⚠️  API server      {api_url}  (HTTP {e.response.status_code})")
    except Exception as e:
        print(f"  ❌ API server      {api_url}  ({e})")

    print("─────────────────────────────────────────────────────────────\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Marksman Range Engine")
    parser.add_argument("--config", default=str(Path(__file__).parent / "config.yaml"),
                        help="Path to config.yaml (default: engine/config.yaml)")
    parser.add_argument("--target", help="Override target type from config")
    parser.add_argument("--camera", help="Override camera source from config")
    parser.add_argument("--range-id", help="Override range_id from config")
    parser.add_argument("--session-id", help="Override session_id from config")
    parser.add_argument("--check", action="store_true",
                        help="Run health check only and exit")
    parser.add_argument("--no-stream", action="store_true",
                        help="Disable MJPEG stream server")
    parser.add_argument("--no-baseline", action="store_true",
                        help="Skip baseline capture at startup")
    args = parser.parse_args()

    # Load config
    if not Path(args.config).exists():
        print(f"❌ Config file not found: {args.config}")
        print("   Copy engine/config.yaml and edit for your setup.")
        sys.exit(1)

    config = load_config(args.config)

    # Apply CLI overrides
    if args.target:
        config.setdefault("target", {})["type"] = args.target
    if args.camera is not None:
        val = int(args.camera) if args.camera.isdigit() else args.camera
        config.setdefault("camera", {})["source"] = val
    if args.range_id:
        config.setdefault("engine", {})["range_id"] = args.range_id
    if args.session_id:
        config.setdefault("api", {})["session_id"] = args.session_id
    if args.no_stream:
        config.setdefault("stream", {})["enabled"] = False
    if args.no_baseline:
        config.setdefault("target", {})["capture_baseline_on_start"] = False

    # Setup logging
    log_cfg = config.get("logging", {})
    setup_logging(log_cfg.get("level", "INFO"), log_cfg.get("log_file", ""))

    vision_url = config.get("vision_service", {}).get("url", "http://localhost:8000")
    api_url    = config.get("api", {}).get("url", "http://localhost:3001")

    health_check(vision_url, api_url)

    if args.check:
        sys.exit(0)

    # Print startup banner
    engine_cfg = config.get("engine", {})
    camera_cfg = config.get("camera", {})
    target_cfg = config.get("target", {})
    stream_cfg = config.get("stream", {})

    print("╔══════════════════════════════════════════════════════════╗")
    print("║          Marksman Range Engine v2.0                     ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print(f"║  Range ID   : {engine_cfg.get('range_id', 'range-01'):<42} ║")
    print(f"║  Target     : {target_cfg.get('type', 'air_rifle_10m'):<42} ║")
    print(f"║  Camera     : {str(camera_cfg.get('source', 0)):<42} ║")
    print(f"║  Vision API : {vision_url:<42} ║")
    print(f"║  App API    : {api_url:<42} ║")
    if stream_cfg.get("enabled", True):
        stream_url = f"http://localhost:{stream_cfg.get('port', 8001)}/mjpeg"
        print(f"║  Stream     : {stream_url:<42} ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    from vision_engine import VisionEngine
    engine = VisionEngine(config)

    try:
        engine.run()
    except KeyboardInterrupt:
        print("\nEngine stopped.")


if __name__ == "__main__":
    main()
