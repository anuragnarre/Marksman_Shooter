"""
Export a trained YOLO26-S model to TFLite format for Android deployment.

Requirements (dev/CI only — not needed in production):
    pip install ultralytics>=8.3.0 torch>=2.2.0

Usage:
    python models_export/export_tflite.py \\
        --model  path/to/shot_detector.pt \\
        --output apps/vision/models/shot_detector_float16.tflite \\
        --imgsz  640 \\
        --fp16

Android integration:
    1. Copy the generated .tflite file to:
       apps/web/android/app/src/main/assets/models/shot_detector.tflite
    2. In VisionPlugin.java, load with:
           Interpreter tflite = new Interpreter(loadModelFile(activity), options);
       where options uses GpuDelegate for hardware acceleration.
    3. The model expects input [1, 3, 640, 640] float32 in [0, 1].
    4. Output [1, num_boxes, 5+num_classes]: parse identical to ONNX path.

INT8 quantisation (smaller model, faster on CPU):
    Pass --int8 and provide a calibration data path (folder of representative
    target images). The calibration dataset should contain at least 100 images
    covering all target types and lighting conditions.
"""

import argparse
import os
import sys


def export_yolo26s_to_tflite(
    model_path: str,
    imgsz: int = 640,
    fp16: bool = True,
    int8: bool = False,
    calibration_data: str = "",
) -> str:
    """
    Export a YOLO26-S .pt model to TFLite format via the Ultralytics API.

    The Ultralytics export chain is:
        .pt  →  ONNX  →  TF SavedModel  →  TFLite

    Args:
        model_path:        Path to trained .pt weights file.
        imgsz:             Input image size (square). Default 640.
        fp16:              Export as float16 (recommended for Android GPU delegate).
        int8:              Export as INT8 (smaller/faster but needs calibration data).
        calibration_data:  Path to calibration image folder (required when int8=True).

    Returns:
        Path to the generated .tflite file.

    Raises:
        FileNotFoundError: If model_path does not exist.
        ImportError:       If ultralytics is not installed.
        ValueError:        If int8=True but no calibration_data provided.
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")

    if int8 and not calibration_data:
        raise ValueError(
            "calibration_data directory is required for INT8 quantisation. "
            "Provide a folder of representative target images."
        )

    try:
        from ultralytics import YOLO
    except ImportError as exc:
        raise ImportError(
            "ultralytics is not installed. "
            "Run: pip install ultralytics>=8.3.0"
        ) from exc

    model = YOLO(model_path)

    export_kwargs = {
        "format": "tflite",
        "imgsz": imgsz,
        "half": fp16 and not int8,
        "int8": int8,
    }
    if int8 and calibration_data:
        export_kwargs["data"] = calibration_data

    print(f"Exporting {model_path} to TFLite (fp16={fp16}, int8={int8}, imgsz={imgsz})...")
    exported_path = model.export(**export_kwargs)
    print(f"TFLite model saved to: {exported_path}")
    return str(exported_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export YOLO26-S shot detector to TFLite for Android."
    )
    parser.add_argument(
        "--model", required=True,
        help="Path to trained YOLO26-S .pt weights",
    )
    parser.add_argument(
        "--output", default="",
        help="Output path (informational; ultralytics controls actual path)",
    )
    parser.add_argument(
        "--imgsz", type=int, default=640,
        help="Input image size (default: 640)",
    )
    parser.add_argument(
        "--fp16", action="store_true", default=True,
        help="Export as float16 (default: True)",
    )
    parser.add_argument(
        "--int8", action="store_true", default=False,
        help="Export as INT8 quantised model (requires --calibration-data)",
    )
    parser.add_argument(
        "--calibration-data", default="",
        help="Path to calibration images folder (required for INT8)",
    )
    args = parser.parse_args()

    try:
        out = export_yolo26s_to_tflite(
            model_path=args.model,
            imgsz=args.imgsz,
            fp16=args.fp16,
            int8=args.int8,
            calibration_data=args.calibration_data,
        )
        print(f"\nDone. TFLite model: {out}")
        print("\nNext steps:")
        print("  1. Copy the .tflite file to:")
        print("     apps/web/android/app/src/main/assets/models/shot_detector.tflite")
        print("  2. Run: npx cap sync android")
    except (FileNotFoundError, ImportError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
