"""
Train Mask R-CNN on synthetic bullet-hole data.

Usage
-----
    # From apps/vision/:
    python scripts/train_maskrcnn.py [--epochs 30] [--real-images PATH]

Pipeline
--------
1. Generate synthetic labeled images with per-hole pixel masks
2. Build a PyTorch Dataset returning (image_tensor, target_dict)
   target_dict = { "boxes": FloatTensor[N,4], "labels": Int64Tensor[N],
                   "masks": BoolTensor[N,H,W] }
3. Fine-tune maskrcnn_resnet50_fpn (COCO pre-trained)
4. Save to models/maskrcnn_holes.pth

The pixel mask for each hole is a filled disc at the rendered hole position
(radius = pellet_r × 0.45, Gaussian falloff threshold at 50 % alpha).

Requirements: torch>=2.2.0, torchvision>=0.17.0
"""

import argparse
import math
import os
import sys
from typing import Dict, List, Tuple

import cv2
import numpy as np

_here = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_here)
sys.path.insert(0, _root)

from tests.generate_synthetic import (
    generate_test_cases, _shot_pixel, _pellet_radius_px, CANVAS_SIZE, CENTER,
)
from pipeline.target_specs import get_spec


# ---------------------------------------------------------------------------
# PyTorch Dataset
# ---------------------------------------------------------------------------

def _build_dataset(target_type: str = "air_rifle_10m"):
    """Lazy-generate synthetic (image, target) pairs for Mask R-CNN training."""
    import torch
    from torch.utils.data import Dataset

    spec = get_spec(target_type)
    cases = list(generate_test_cases(target_type))
    pellet_r = _pellet_radius_px(spec)

    class BulletHoleDataset(Dataset):
        def __getitem__(self, idx: int):
            img, annotations, _ = cases[idx]
            img_h, img_w = img.shape[:2]

            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img_tensor = torch.from_numpy(
                rgb.transpose(2, 0, 1)).float().div(255.0)

            boxes, labels, masks = [], [], []
            hole_r = max(2, int(pellet_r * 0.45))
            box_r  = max(4, int(pellet_r * 0.65))

            import math as _math
            for ann in annotations:
                x_mm, y_mm = ann["x_mm"], ann["y_mm"]
                dist_mm = _math.sqrt(x_mm ** 2 + y_mm ** 2)
                angle_deg = _math.degrees(_math.atan2(y_mm, x_mm))
                cx_px, cy_px = _shot_pixel(spec, dist_mm, angle_deg)
                cx_px, cy_px = int(round(cx_px)), int(round(cy_px))

                if not (box_r < cx_px < img_w - box_r and
                        box_r < cy_px < img_h - box_r):
                    continue

                x1 = max(0, cx_px - box_r)
                y1 = max(0, cy_px - box_r)
                x2 = min(img_w, cx_px + box_r)
                y2 = min(img_h, cy_px + box_r)
                boxes.append([x1, y1, x2, y2])
                labels.append(1)

                # Binary mask: filled disc at hole centre
                mask = np.zeros((img_h, img_w), dtype=np.uint8)
                cv2.circle(mask, (cx_px, cy_px), hole_r, 1, -1)
                masks.append(mask.astype(bool))

            if not boxes:
                # No valid annotations — return dummy (will be skipped by collate)
                dummy_box = torch.zeros((0, 4), dtype=torch.float32)
                dummy_lbl = torch.zeros(0, dtype=torch.int64)
                dummy_msk = torch.zeros((0, img_h, img_w), dtype=torch.bool)
                target = {"boxes": dummy_box, "labels": dummy_lbl, "masks": dummy_msk}
                return img_tensor, target

            target = {
                "boxes":  torch.tensor(boxes,  dtype=torch.float32),
                "labels": torch.tensor(labels, dtype=torch.int64),
                "masks":  torch.tensor(np.stack(masks), dtype=torch.bool),
            }
            return img_tensor, target

        def __len__(self):
            return len(cases)

    return BulletHoleDataset()


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train(
    target_type: str = "air_rifle_10m",
    epochs: int = 30,
    batch_size: int = 4,
    lr: float = 1e-4,
    output_path: str = "models/maskrcnn_holes.pth",
) -> None:
    try:
        import torch
        import torchvision
        from torch.utils.data import DataLoader
    except ImportError:
        print("ERROR: torch/torchvision not installed.")
        print("  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu")
        sys.exit(1)

    # Import model builder from our inference module
    sys.path.insert(0, _root)
    from pipeline.mask_detector import _build_maskrcnn

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")

    dataset = _build_dataset(target_type)
    n_val = max(1, int(len(dataset) * 0.15))
    n_train = len(dataset) - n_val
    train_ds, val_ds = torch.utils.data.random_split(dataset, [n_train, n_val])

    def collate_fn(batch):
        imgs = [b[0] for b in batch if b[1]["boxes"].shape[0] > 0]
        tgts = [b[1] for b in batch if b[1]["boxes"].shape[0] > 0]
        return imgs, tgts

    train_loader = DataLoader(train_ds, batch_size=batch_size,
                              shuffle=True, collate_fn=collate_fn)
    val_loader   = DataLoader(val_ds,   batch_size=1,
                              shuffle=False, collate_fn=collate_fn)

    model = _build_maskrcnn(num_classes=2).to(device)

    # Fine-tune all parameters but use a low LR for backbone
    params = [
        {"params": [p for n, p in model.named_parameters()
                    if "backbone" in n], "lr": lr * 0.1},
        {"params": [p for n, p in model.named_parameters()
                    if "backbone" not in n], "lr": lr},
    ]
    optimizer = torch.optim.AdamW(params, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_loss = float("inf")
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        n_batches = 0

        for imgs, targets in train_loader:
            if not imgs:
                continue
            imgs = [img.to(device) for img in imgs]
            targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

            loss_dict = model(imgs, targets)
            loss = sum(loss_dict.values())
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += float(loss)
            n_batches += 1

        scheduler.step()

        # Validation loss
        model.train()  # keep in train mode to get losses
        val_loss = 0.0
        n_val_batches = 0
        with torch.no_grad():
            for imgs, targets in val_loader:
                if not imgs:
                    continue
                imgs = [img.to(device) for img in imgs]
                targets = [{k: v.to(device) for k, v in t.items()} for t in targets]
                try:
                    loss_dict = model(imgs, targets)
                    val_loss += float(sum(loss_dict.values()))
                    n_val_batches += 1
                except Exception:
                    pass

        avg_train = train_loss / max(1, n_batches)
        avg_val   = val_loss   / max(1, n_val_batches)
        print(f"Epoch {epoch:3d}/{epochs}  train={avg_train:.4f}  val={avg_val:.4f}")

        if avg_val < best_val_loss:
            best_val_loss = avg_val
            torch.save(model.state_dict(), output_path)
            print(f"  → saved best model (val_loss={best_val_loss:.4f})")

    print(f"\nTraining complete. Best model: {output_path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Mask R-CNN on bullet-hole data")
    parser.add_argument("--target",  default="air_rifle_10m")
    parser.add_argument("--epochs",  type=int, default=30)
    parser.add_argument("--batch",   type=int, default=4)
    parser.add_argument("--lr",      type=float, default=1e-4)
    parser.add_argument("--output",  default="models/maskrcnn_holes.pth")
    args = parser.parse_args()

    print(f"Training Mask R-CNN on synthetic {args.target} data")
    train(
        target_type=args.target,
        epochs=args.epochs,
        batch_size=args.batch,
        lr=args.lr,
        output_path=args.output,
    )
