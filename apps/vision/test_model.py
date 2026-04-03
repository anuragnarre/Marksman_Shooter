import sys
sys.path.insert(0, '.')

from pipeline.yolo_detector import load_yolo_model, detect_holes_yolo
import cv2

loaded = load_yolo_model()
print('Model loaded:', loaded)

img = cv2.imread('/mnt/d/Do Not Open/pulse/shooting/shoot/WhatsApp Image 2026-03-19 at 3.59.43 PM.jpeg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray_resized = cv2.resize(gray, (1000, 1000))

from pipeline.types import TargetCalibration
cal = TargetCalibration(center=(500, 500), major_radius=480, minor_radius=480,
                        rotation_deg=0.0, eccentricity=0.0, mm_per_pixel=0.17, confidence=0.9)
holes = detect_holes_yolo(gray_resized, cal, 'air_rifle_10m')
print(f'Detected {len(holes)} holes')
for h in holes:
    print(f'  x={h.x:.1f} y={h.y:.1f} r={h.radius:.1f} conf={h.confidence:.2f}')
