# Vision Model Files

The pipeline uses two optional neural models for improved shot detection.
Without them the service runs in **CV-only mode** with reduced accuracy for
tight shot groups (~35% more missed shots compared to full neural mode).

---

## Model Files Expected

| File | Purpose | Size |
|------|---------|------|
| `models/shot_detector.onnx` | YOLO26-S ONNX (primary model) | ~85 MB |
| `models/shot_detector_yolo26s.onnx` | YOLO26-S ONNX (alternate path) | ~85 MB |
| `models/shot_detector_yolo26s.pt` | YOLO26-S PyTorch checkpoint | ~85 MB |
| `models/maskrcnn_holes.pth` | Mask R-CNN fine-tuned state dict | ~170 MB |

---

## Training Commands

### 1. Generate synthetic training data

```bash
cd apps/vision
python scripts/generate_synthetic.py \
    --output-dir data/synthetic \
    --num-images 2000 \
    --target-types air_rifle_10m air_pistol_10m nr_50m nr_25m
```

### 2. Train YOLO26-S

```bash
# Install training deps (not required for inference)
pip install ultralytics>=8.3.0 torch>=2.2.0 torchvision>=0.17.0

python scripts/train_yolo26s.py \
    --data data/synthetic/dataset.yaml \
    --model yolo26s.pt \
    --epochs 100 \
    --imgsz 640 \
    --batch 16 \
    --project runs/yolo26s \
    --name shot_detector

# Export to ONNX (used by onnxruntime in production — no torch required)
python scripts/train_yolo26s.py --export \
    --weights runs/yolo26s/shot_detector/weights/best.pt \
    --output models/shot_detector.onnx
```

### 3. Train Mask R-CNN

```bash
python scripts/train_maskrcnn.py \
    --data data/synthetic \
    --epochs 50 \
    --batch 4 \
    --output models/maskrcnn_holes.pth
```

### 4. Verify models loaded

```bash
curl http://localhost:8000/health | python -m json.tool
# Expected (with models):
# {
#   "neural_models_loaded": true,
#   "accuracy_mode": "full",
#   ...
# }
```

---

## Notes

- The ONNX model is loaded by `onnxruntime` (CPU) — no GPU or PyTorch needed at inference time.
- Mask R-CNN requires `torch` and `torchvision` at inference time. If not installed, the pipeline
  falls back to YOLO26-S + CV only (still "full" mode if YOLO26-S is available).
- On startup, if **neither** model is found, the service emits a `warnings.warn` and the
  `/health` endpoint returns `"accuracy_mode": "cv_only_reduced_accuracy"`.
