"""
Train YOLO26-S on synthetic bullet-hole data.

Usage
-----
    # From apps/vision/:
    python scripts/train_yolo26s.py [--epochs 100] [--real-images PATH] [--export]

Pipeline
--------
1. Generate labeled synthetic images (generate_synthetic.py)
2. Write YOLO-format dataset (images/ + labels/ + data.yaml)
3. Fine-tune YOLO26-S starting from COCO pre-trained weights
4. Optionally export best.pt → models/shot_detector_yolo26s.onnx

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

    # Stream the generator to avoid loading ~790 MB of images into RAM at once.
    # Use modulo-based val split (every nth image) instead of pre-computing val_idxs.
    n_per_val = max(1, round(1.0 / val_fraction))  # e.g. every 7th image → val

    for i, (img, annotations, desc) in enumerate(generate_test_cases(target_type)):
        split = "val" if (i % n_per_val == 0) else "train"
        img_h, img_w = img.shape[:2]

        fname = f"{i:05d}_{desc[:40]}"
        img_path = os.path.join(out_dir, "images", split, fname + ".png")
        lbl_path = os.path.join(out_dir, "labels", split, fname + ".txt")

        # Write JPEG (much faster than PNG on Windows/WSL due to smaller file size)
        cv2.imwrite(img_path.replace(".png", ".jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        img_path = img_path.replace(".png", ".jpg")

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

        if i > 0 and i % 50 == 0:
            print(f"  Synthetic: {i} images written...")

    print(f"  Synthetic: done.")
    # Optionally add real images with auto-generated labels from the CV pipeline
    if real_images_dir and os.path.isdir(real_images_dir):
        _add_real_images_with_autolabel(out_dir, real_images_dir, spec, target_type, val_fraction)

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


def _add_real_images_with_autolabel(
    out_dir: str,
    real_dir: str,
    spec: TargetSpec,
    target_type: str,
    val_fraction: float = 0.15,
) -> None:
    """
    Auto-label real photos using the CV pipeline and add them to the dataset.
    Images where the pipeline detects ≥1 hole get a YOLO label file.
    Images with 0 detections are copied as background (empty label).
    """
    import random
    from analyzer import analyze_target_image

    exts = {".jpg", ".jpeg", ".png", ".bmp"}
    real_images = sorted([
        f for f in os.listdir(real_dir)
        if os.path.splitext(f.lower())[1] in exts
    ])
    random.shuffle(real_images)
    n_val = max(1, int(len(real_images) * val_fraction))

    labeled = background = errors = 0
    for i, fname in enumerate(real_images):
        split = "val" if i < n_val else "train"
        src = os.path.join(real_dir, fname)
        stem = os.path.splitext(fname)[0]

        dest_img = os.path.join(out_dir, "images", split, "real_" + fname)
        dest_lbl = os.path.join(out_dir, "labels", split, "real_" + stem + ".txt")

        shutil.copy2(src, dest_img)

        try:
            with open(src, "rb") as fh:
                image_bytes = fh.read()
            result = analyze_target_image(image_bytes, target_type)

            # Use actual warp dimensions (not always 1000×1000 — ellipse warp
            # produces variable-height images, e.g. 750×1000).
            img_w = result.warp_width  if result.warp_width  > 0 else 1000
            img_h = result.warp_height if result.warp_height > 0 else 1000

            lines = []
            for shot in result.shots:
                cx_n = shot.pixel_x / img_w
                cy_n = shot.pixel_y / img_h
                r_px = _pellet_radius_px(spec)
                # YOLO box = 3× physical radius so partially-obscured holes are covered
                w_n = h_n = max(0.005, (r_px * 3) / img_w)
                cx_n = max(0.01, min(0.99, cx_n))
                cy_n = max(0.01, min(0.99, cy_n))
                lines.append(f"0 {cx_n:.6f} {cy_n:.6f} {w_n:.6f} {h_n:.6f}")

            with open(dest_lbl, "w") as f:
                f.write("\n".join(lines))

            if lines:
                labeled += 1
            else:
                background += 1

        except Exception as exc:
            # Pipeline failed — write as background so training still uses the image
            open(dest_lbl, "w").close()
            errors += 1

        if (i + 1) % 25 == 0:
            print(f"  Real images: {i + 1}/{len(real_images)} processed "
                  f"(labeled={labeled} bg={background} err={errors})")

    print(f"Real images: {labeled} labeled, {background} background, "
          f"{errors} errors → {len(real_images)} total")


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train(
    data_yaml: str,
    epochs: int = 150,
    batch: int = 8,
    output_model: str = "models/shot_detector_yolo26s.pt",
    export_onnx: bool = True,
) -> None:
    """Fine-tune YOLO26-S and save to output_model."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ERROR: ultralytics not installed. Run: pip install ultralytics>=8.3.0")
        sys.exit(1)

    os.makedirs(os.path.dirname(output_model) or ".", exist_ok=True)

    # Start from COCO-pretrained YOLO26-S
    model = YOLO("yolo26s.pt")

    results = model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch,
        imgsz=1280,            # high-res for sub-mm holes at distance
        patience=25,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        weight_decay=0.0005,
        warmup_epochs=5,
        # Loss weights — dfl=0 because YOLO26 uses NMS-free anchor-free head
        box=7.5,
        cls=0.5,
        dfl=0.0,
        # Augmentation tuned for paper targets under variable lighting
        augment=True,
        hsv_h=0.015,
        hsv_s=0.5,
        hsv_v=0.5,
        degrees=15.0,
        scale=0.4,
        fliplr=0.5,
        mosaic=0.8,
        copy_paste=0.1,        # copies sparse holes across images
        project="runs/yolo26s_bullets",
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
        model_best = YOLO(output_model)
        model_best.export(
            format="onnx",
            imgsz=1280,
            opset=12,
            simplify=True,
            dynamic=False,
        )
        onnx_path = output_model.replace(".pt", ".onnx")
        if os.path.exists(onnx_path):
            print(f"ONNX exported → {onnx_path}")
        else:
            print("ONNX export path may differ — check the ultralytics output above")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO26-S on synthetic bullet-hole data")
    parser.add_argument("--target",      default="air_rifle_10m",
                        help="Target type (default: air_rifle_10m)")
    parser.add_argument("--epochs",      type=int, default=150)
    parser.add_argument("--batch",       type=int, default=8)
    parser.add_argument("--real-images", default="",
                        help="Path to folder of real target photos (auto-labeled by CV pipeline)")
    parser.add_argument("--dataset-dir", default="datasets/yolo26s_holes",
                        help="Output dataset directory")
    parser.add_argument("--output",      default="models/shot_detector_yolo26s.pt")
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
        print(f"\nTraining YOLO26-S for {args.epochs} epochs…")
        train(yaml, epochs=args.epochs, batch=args.batch,
              output_model=args.output, export_onnx=args.export)
