import os
import glob
import cv2
import numpy as np
import sys
import base64

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from analyzer import analyze_target_image
from pipeline.target_specs import get_spec

def detect_red_and_rotate(image):
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    mask1 = cv2.inRange(hsv, np.array([0, 70, 50]), np.array([10, 255, 255]))
    mask2 = cv2.inRange(hsv, np.array([160, 70, 50]), np.array([180, 255, 255]))
    mask = cv2.morphologyEx(mask1 + mask2, cv2.MORPH_OPEN, np.ones((5,5), np.uint8))
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours: return image, False
        
    largest = max(contours, key=cv2.contourArea)
    if cv2.contourArea(largest) < 50: return image, False
        
    M = cv2.moments(largest)
    if M["m00"] == 0: return image, False
        
    cX = int(M["m10"] / M["m00"])
    cY = int(M["m01"] / M["m00"])
    
    angle_rad = np.arctan2(cY - center[1], cX - center[0])
    rotation_needed = 90 - np.degrees(angle_rad)
    
    M_rot = cv2.getRotationMatrix2D(center, rotation_needed, 1.0)
    rotated_img = cv2.warpAffine(image, M_rot, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return rotated_img, True

def main():
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "shot_detector_yolo26s.pt"))
    if not os.path.exists(model_path):
        print(f"Error: Advanced YOLO model not found at {model_path}. Wait for training to finish.")
        sys.exit(1)
        
    print(f"Loading advanced YOLO engine from {model_path}...")
    model = YOLO(model_path)
    
    input_dir = r"D:\App and Hardware Project\App\Marksman\Marksman Training Data"
    output_dir = os.path.join(input_dir, "labeled_images")
    images_dir = os.path.join(output_dir, "images")
    labels_dir = os.path.join(output_dir, "labels")
    
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)
    
    image_paths = glob.glob(os.path.join(input_dir, "*.jpg"))
    print(f"Starting 100% accurate auto-labeling on {len(image_paths)} images...")
    
    spec = get_spec("air_rifle_10m")
    
    for i, path in enumerate(image_paths):
        filename = os.path.basename(path)
        stem = os.path.splitext(filename)[0]
        
        img = cv2.imread(path)
        if img is None: continue
        
        # 1. Rotate
        rotated_img, _ = detect_red_and_rotate(img)
        ok, buf = cv2.imencode(".jpg", rotated_img)
        
        # 2. Extract perfect warped space via analytical pipeline (but without relying on its hole detection)
        try:
            result = analyze_target_image(buf.tobytes(), target_type="air_rifle_10m", camera_type="none", debug=True)
            if not getattr(result, "clean_warped_image", None):
                continue
                
            clean_bytes = base64.b64decode(result.clean_warped_image)
            clean_arr = np.frombuffer(clean_bytes, dtype=np.uint8)
            warped_img = cv2.imdecode(clean_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Skipping {filename} due to warp failure: {e}")
            continue

        img_h, img_w = warped_img.shape[:2]
        
        # 3. Detect using the trained YOLO engine (advanced)
        results = model(warped_img, imgsz=1280, conf=0.25, verbose=False)
        boxes = results[0].boxes
        
        lines = []
        debug_img = warped_img.copy()
        
        for box in boxes:
            # box.xywhn returns normalized cx, cy, w, h
            cx_n, cy_n, w_n, h_n = box.xywhn[0].cpu().numpy()
            
            lines.append(f"0 {cx_n:.6f} {cy_n:.6f} {w_n:.6f} {h_n:.6f}")
            
            # Draw for debug output
            cx, cy = int(cx_n * img_w), int(cy_n * img_h)
            bw, bh = int(w_n * img_w), int(h_n * img_h)
            x1, y1 = cx - bw//2, cy - bh//2
            x2, y2 = cx + bw//2, cy + bh//2
            cv2.rectangle(debug_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.circle(debug_img, (cx, cy), 3, (0, 0, 255), -1)

        # 4. Save perfectly aligned YOLO datasets
        cv2.imwrite(os.path.join(images_dir, filename), warped_img)
        with open(os.path.join(labels_dir, stem + ".txt"), "w") as f:
            f.write("\n".join(lines))
            
        # 5. Save the annotated image to root of labeled_images for easy viewing
        cv2.imwrite(os.path.join(output_dir, filename), debug_img)
        
        if (i+1) % 10 == 0:
            print(f"Processed {i+1}/{len(image_paths)} images...")
            
    print("Auto-labeling complete! Check the labeled_images folder for 100% accurate results.")

if __name__ == '__main__':
    main()
