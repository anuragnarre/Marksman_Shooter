"""
Export a trained YOLOv8-S model to CoreML format for iOS deployment.

Requirements (macOS + dev/CI only — not needed in production):
    pip install ultralytics>=8.3.0 coremltools>=7.0 torch>=2.2.0

Note: CoreML export must be run on macOS. The resulting .mlpackage bundle
is then added to the iOS Xcode project under Resources/.

Usage:
    python models_export/export_coreml.py \\
        --model  path/to/shot_detector.pt \\
        --imgsz  640 \\
        --nms

iOS integration:
    1. Copy the generated shot_detector.mlpackage to:
       apps/web/ios/App/App/Resources/shot_detector.mlpackage
    2. In Xcode: Add Files → Add the .mlpackage bundle.
    3. Load in Swift:
           let model = try VNCoreMLModel(for: ShotDetector(configuration: .init()).model)
           let request = VNCoreMLRequest(model: model) { ... }
    4. Run via Vision framework on a CVPixelBuffer from AVFoundation.

NMS flag:
    --nms embeds Non-Maximum Suppression directly in the CoreML graph,
    simplifying the Swift inference code significantly. Recommended.
"""

import argparse
import os
import sys


def export_yolov8s_to_coreml(
    model_path: str,
    imgsz: int = 640,
    nms: bool = True,
) -> str:
    """
    Export a YOLOv8-S .pt model to CoreML (.mlpackage) format.

    The Ultralytics export chain is:
        .pt  →  ONNX  →  CoreML .mlpackage

    Args:
        model_path: Path to trained .pt weights file.
        imgsz:      Input image size (square). Default 640.
        nms:        Embed NMS in the CoreML graph (recommended — simplifies
                    Swift inference code).

    Returns:
        Path to the generated .mlpackage bundle.

    Raises:
        FileNotFoundError: If model_path does not exist.
        ImportError:       If ultralytics or coremltools is not installed.
        RuntimeError:      If not running on macOS.
    """
    import platform
    if platform.system() != "Darwin":
        raise RuntimeError(
            "CoreML export requires macOS. "
            "Run this script on a Mac or in a macOS CI environment."
        )

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")

    try:
        from ultralytics import YOLO
    except ImportError as exc:
        raise ImportError(
            "ultralytics is not installed. "
            "Run: pip install ultralytics>=8.3.0"
        ) from exc

    try:
        import coremltools  # noqa: F401 — verify it is installed before export
    except ImportError as exc:
        raise ImportError(
            "coremltools is not installed. "
            "Run: pip install coremltools>=7.0"
        ) from exc

    model = YOLO(model_path)

    print(f"Exporting {model_path} to CoreML (imgsz={imgsz}, nms={nms})...")
    exported_path = model.export(
        format="coreml",
        imgsz=imgsz,
        nms=nms,
    )
    print(f"CoreML model saved to: {exported_path}")
    return str(exported_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export YOLOv8-S shot detector to CoreML for iOS."
    )
    parser.add_argument(
        "--model", required=True,
        help="Path to trained YOLOv8-S .pt weights",
    )
    parser.add_argument(
        "--imgsz", type=int, default=640,
        help="Input image size (default: 640)",
    )
    parser.add_argument(
        "--nms", action="store_true", default=True,
        help="Embed NMS in CoreML graph (default: True)",
    )
    parser.add_argument(
        "--no-nms", action="store_false", dest="nms",
        help="Disable embedded NMS",
    )
    args = parser.parse_args()

    try:
        out = export_yolov8s_to_coreml(
            model_path=args.model,
            imgsz=args.imgsz,
            nms=args.nms,
        )
        print(f"\nDone. CoreML model: {out}")
        print("\nNext steps:")
        print("  1. Copy the .mlpackage bundle to:")
        print("     apps/web/ios/App/App/Resources/shot_detector.mlpackage")
        print("  2. Add the bundle to your Xcode project.")
        print("  3. Run: npx cap sync ios")
    except (FileNotFoundError, ImportError, RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
