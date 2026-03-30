#!/usr/bin/env bash
# Train YOLOv11-L and export to ONNX.
# Usage: bash apps/vision/scripts/train_models.sh [path-to-real-images]
# The resulting model file is written to apps/vision/models/shot_detector_yolo11l.onnx.
# Restart the vision service after training to load the new model.
set -euo pipefail

REAL_IMAGES="${1:-../../shoot}"
cd "$(dirname "$0")/.."

echo "Installing ultralytics (required for training)..."
pip install "ultralytics>=8.3.0"

echo "Training YOLOv11-L with real images from: $REAL_IMAGES"
python scripts/train_yolo11.py \
  --real-images "$REAL_IMAGES" \
  --export \
  --output models/shot_detector_yolo11l.pt

echo ""
echo "Done. Restart the vision service to load the YOLO model:"
echo "  cd apps/vision && uvicorn main:app --reload"
