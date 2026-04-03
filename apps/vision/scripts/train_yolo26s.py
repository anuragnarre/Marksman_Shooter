"""
Train YOLOv11-L on synthetic bullet-hole data.

Usage
-----
    # From apps/vision/:
    python scripts/train_yolo11.py [--epochs 100] [--real-images PATH] [--export]

Pipeline
--------
1. Generate labeled synthetic images (generate_synthetic.py)
2. Write YOLO-format dataset (images/ + labels/ + data.yaml)
3. Fine-tune YOLOv11-L starting from COCO pre-trained weights
4. Optionally export best.pt → models/shot_detector_yolo11l.onnx

Synthetic label format (YOLO):
    class cx cy w h     (normalized 0-1)
    class = 0 always (single class: bullet_hole)

The synthetic generator knows exact hole positions, so labels are lossless.
"""

import argparse
import math
import os
import shutil
import sys

import cv2
import numpy as np

_here = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_here)
sys.path.insert(0, _root)

from tests.generate_synthetic import generate_test_cases, _shot_pixel, _pellet_radius_px
from pipeline.target_specs import get_spec, TargetSpec


# ---------------------------------------------------------------------------
# Dataset generation
# ---------------------------------------------------------------------------

def generate_yolo_dataset(
    out_dir: str,
    target_type: str = "air_rifle_10m",
    real_images_dir: str = "",
    val_fraction: float = 0.15,
) -> str:
    """
    Generate a YOLO-format dataset from synthetic cases.

    Directory layout:
        out_dir/
          images/train/*.png
          images/val/*.png
          labels/train/*.txt
          labels/val/*.txt
          data.yaml

    Returns path to data.yaml.
    """
    spec = get_spec(target_type)

    for split in ("train", "val"):
        os.makedirs(os.path.join(out_dir, "images", split), exist_ok=True)
        os.makedirs(os.path.join(out_dir, "labels", split), exist_ok=True)

    all_cases = list(generate_test_cases(target_type))
    n_val = max(1, int(len(all_cases) * val_fraction))
    val_idxs = set(range(0, len(all_cases), max(1, len(all_cases) // n_val)))

    for i, (img, annotations, desc) in enumerate(all_cases):
        split = "val" if i in val_idxs else "train"
        img_h, img_w = img.shape[:2]

        fname = f"{i:05d}_{desc[:40]}"
        img_path = os.path.join(out_dir, "images", split, fname + ".png")
        lbl_path = os.path.join(out_dir, "labels", split, fname + ".txt")

        cv2.imwrite(img_path, img)

        pellet_r = _pellet_radius_px(spec)
        box_half = pellet_r * 1.5   # slightly larger than physical hole

        lines = []
        for ann in annotations:
            x_mm, y_mm = ann["x_mm"], ann["y_mm"]
            dist_mm = math.sqrt(x_mm ** 2 + y_mm ** 2)
            angle_deg = math.degrees(math.atan2(y_mm, x_mm))

            from tests.generate_synthetic import CENTER
            cx_px, cy_px = _shot_pixel(spec, dist_mm, angle_deg)

            # YOLO format: class cx cy w h (normalized)
            cx_n = cx_px / img_w
            cy_n = cy_px / img_h
            w_n  = (box_half * 2) / img_w
            h_n  = (box_half * 2) / img_h

            # Clamp to [0,1]
            cx_n = max(0.01, min(0.99, cx_n))
            cy_n = max(0.01, min(0.99, cy_n))
            w_n  = max(0.005, min(0.5, w_n))
            h_n  = max(0.005, min(0.5, h_n))

            lines.append(f"0 {cx_n:.6f} {cy_n:.6f} {w_n:.6f} {h_n:.6f}")

        with open(lbl_path, "w") as f:
            f.write("\n".join(lines))

    # Optionally add real images (unlabeled — skipped or pseudo-labeled)
    if real_images_dir and os.path.isdir(real_images_dir):
        _add_real_images(out_dir, real_images_dir, spec)

    # Write data.yaml
    yaml_path = os.path.join(out_dir, "data.yaml")
    abs_out = os.path.abspath(out_dir)
    with open(yaml_path, "w") as f:
        f.write(f"path: {abs_out}\n")
        f.write("train: images/train\n")
        f.write("val:   images/val\n")
        f.write("nc: 1\n")
        f.write("names: ['bullet_hole']\n")

    train_count = len(os.listdir(os.path.join(out_dir, "images", "train")))
    val_count   = len(os.listdir(os.path.join(out_dir, "images", "val")))
    print(f"Dataset: {train_count} train, {val_count} val → {yaml_path}")
    return yaml_path


def _add_real_images(out_dir: str, real_dir: str, spec: TargetSpec) -> None:
    """
    Copy real images to train set without labels (semi-supervised).
    Unlabeled images help the model generalise to real paper texture.
    Ultralytics handles missing label files as background-only images.
    """
    exts = {".jpg", ".jpeg", ".png", ".bmp"}
    real_images = [
        f for f in os.listdir(real_dir)
        if os.path.splitext(f.lower())[1] in exts
    ]
    dest = os.path.join(out_dir, "images", "train")
    for fname in real_images:
        src = os.path.join(real_dir, fname)
        shutil.copy2(src, os.path.join(dest, "real_" + fname))
    print(f"Added {len(real_images)} real images (unlabeled) to train set")


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train(
    data_yaml: str,
    epochs: int = 100,
    batch: int = 16,
    output_model: str = "models/shot_detector_yolo11l.pt",
    export_onnx: bool = True,
) -> None:
    """Fine-tune YOLOv11-L and save to output_model."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ERROR: ultralytics not installed. Run: pip install ultralytics>=8.3.0")
        sys.exit(1)

    os.makedirs(os.path.dirname(output_model) or ".", exist_ok=True)

    # Start from COCO-pretrained YOLOv11-L
    model = YOLO("yolo11l.pt")

    results = model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch,
        imgsz=640,
        patience=20,          # early stopping
        augment=True,
        hsv_h=0.015,
        hsv_s=0.3,
        hsv_v=0.4,            # brightness augmentation for lighting variants
        degrees=15.0,          # rotation augmentation
        scale=0.3,
        fliplr=0.5,
        mosaic=0.5,
        project="runs/yolo11_holes",
        name="train",
        exist_ok=True,
    )

    # Copy best weights to output path
    best_pt = results.save_dir / "weights" / "best.pt"
    if best_pt.exists():
        shutil.copy2(str(best_pt), output_model)
        print(f"\nBest model saved → {output_model}")
    else:
        print(f"WARNING: best.pt not found at {best_pt}")
        return

    if export_onnx:
        onnx_path = output_model.replace(".pt", ".onnx")
        model_best = YOLO(output_model)
        model_best.export(format="onnx", imgsz=640, simplify=True)
        # Ultralytics exports next to the .pt file
        exported = output_model.replace(".pt", ".onnx")
        if os.path.exists(exported):
            print(f"ONNX exported → {exported}")
        else:
            print("ONNX export path may differ — check the ultralytics export output above")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv11-L on synthetic bullet-hole data")
    parser.add_argument("--target",      default="air_rifle_10m",
                        help="Target type (default: air_rifle_10m)")
    parser.add_argument("--epochs",      type=int, default=100)
    parser.add_argument("--batch",       type=int, default=16)
    parser.add_argument("--real-images", default="",
                        help="Path to folder of real target photos (optional, unlabeled)")
    parser.add_argument("--dataset-dir", default="datasets/yolo11_holes",
                        help="Output dataset directory")
    parser.add_argument("--output",      default="models/shot_detector_yolo11l.pt")
    parser.add_argument("--export",      action="store_true",
                        help="Export best.pt to ONNX after training")
    parser.add_argument("--no-train",    action="store_true",
                        help="Only generate dataset, do not train")
    args = parser.parse_args()

    print(f"Generating dataset for {args.target}…")
    yaml = generate_yolo_dataset(
        out_dir=args.dataset_dir,
        target_type=args.target,
        real_images_dir=args.real_images,
    )

    if not args.no_train:
        print(f"\nTraining YOLOv11-L for {args.epochs} epochs…")
        train(yaml, epochs=args.epochs, batch=args.batch,
              output_model=args.output, export_onnx=args.export)
