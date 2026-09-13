import os
import cv2
import glob
import numpy as np
import sys
import shutil

# Ensure we can import from the vision app root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from analyzer import analyze_target_image
from pipeline.target_specs import get_spec
import pipeline.yolo_detector as _yd

# Disable YOLO to force CV-only detection for pseudo-labeling
_yd._yolo_available = False

def detect_red_and_rotate(image):
    """
    Detects red ink in the image, assumes it should be at the bottom ('facing down').
    Rotates the image so the red ink is at the bottom center (6 o'clock position).
    """
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    
    # Convert to HSV
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Red has two ranges in HSV
    lower_red1 = np.array([0, 70, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 70, 50])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    mask = mask1 + mask2
    
    # Noise reduction
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5,5), np.uint8))
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return image, False # return original if nothing found
        
    # Find the largest red contour
    largest_contour = max(contours, key=cv2.contourArea)
    if cv2.contourArea(largest_contour) < 50:
        return image, False
        
    M = cv2.moments(largest_contour)
    
    if M["m00"] == 0:
        return image, False
        
    cX = int(M["m10"] / M["m00"])
    cY = int(M["m01"] / M["m00"])
    
    # Calculate angle from center of image to red ink center
    # In OpenCV, y increases downwards. 
    # Bottom center corresponds to angle = 90 degrees (pi/2 radians)
    dx = cX - center[0]
    dy = cY - center[1]
    
    angle_rad = np.arctan2(dy, dx)
    angle_deg = np.degrees(angle_rad)
    
    # We want the red ink to be at the bottom (90 degrees).
    # So we need to rotate by: rotation = 90 - angle_deg
    rotation_needed = 90 - angle_deg
    
    # Rotate the image
    M_rot = cv2.getRotationMatrix2D(center, rotation_needed, 1.0)
    rotated_img = cv2.warpAffine(image, M_rot, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    
    return rotated_img, True


def _pellet_radius_px(spec, warp_mm_per_pixel):
    """Calculate pellet radius in pixels for YOLO bounding box."""
    if warp_mm_per_pixel > 0:
        return (spec.pellet_diameter_mm / 2.0) / warp_mm_per_pixel
    return 10.0 # fallback

def main():
    input_dir = r"D:\App and Hardware Project\App\Marksman\Marksman Training Data"
    output_dir = os.path.join(input_dir, "processed")
    
    images_dir = os.path.join(output_dir, "images", "train")
    labels_dir = os.path.join(output_dir, "labels", "train")
    debug_dir = os.path.join(input_dir, "labeled_images")
    
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)
    os.makedirs(debug_dir, exist_ok=True)
    
    image_paths = glob.glob(os.path.join(input_dir, "*.jpg"))
    print(f"Found {len(image_paths)} images to process.")
    
    target_type = "air_rifle_10m"
    spec = get_spec(target_type)
    
    success_count = 0
    
    for i, path in enumerate(image_paths):
        filename = os.path.basename(path)
        stem = os.path.splitext(filename)[0]
        print(f"[{i+1}/{len(image_paths)}] Processing {filename}...")
        
        img = cv2.imread(path)
        if img is None:
            continue
            
        rotated_img, rotated = detect_red_and_rotate(img)
        
        ok, buf = cv2.imencode(".jpg", rotated_img)
        if not ok:
            continue
            
        try:
            # We run it with debug=True so we can extract the warped image later if we want, 
            # but for now we just want the AnalysisResponse to get shots and warp_width/height.
            result = analyze_target_image(
                buf.tobytes(), 
                target_type=target_type, 
                camera_type="none",
                debug=True
            )
            
            # Save the cleanly warped image for training
            # This is critical because the shot coordinates (pixel_x, pixel_y) are relative
            # to the warped coordinate space, not the original unwarped image!
            import base64
            if getattr(result, "clean_warped_image", None):
                clean_bytes = base64.b64decode(result.clean_warped_image)
                clean_arr = np.frombuffer(clean_bytes, dtype=np.uint8)
                train_img = cv2.imdecode(clean_arr, cv2.IMREAD_COLOR)
            else:
                train_img = rotated_img
                
            img_w = train_img.shape[1]
            img_h = train_img.shape[0]
            
            out_img_path = os.path.join(images_dir, filename)
            cv2.imwrite(out_img_path, train_img)
            
            # Write YOLO label
            lines = []
            for shot in result.shots:
                cx_n = shot.pixel_x / img_w
                cy_n = shot.pixel_y / img_h
                r_px = _pellet_radius_px(spec, result.warp_mm_per_pixel)
                
                # YOLO box = 3x physical radius so partially-obscured holes are covered
                w_n = h_n = max(0.005, (r_px * 3) / img_w)
                
                cx_n = max(0.01, min(0.99, cx_n))
                cy_n = max(0.01, min(0.99, cy_n))
                
                lines.append(f"0 {cx_n:.6f} {cy_n:.6f} {w_n:.6f} {h_n:.6f}")
                
            out_lbl_path = os.path.join(labels_dir, stem + ".txt")
            with open(out_lbl_path, "w") as f:
                f.write("\n".join(lines))
                
            # Save debug image
            if result.debug_image:
                debug_bytes = base64.b64decode(result.debug_image)
                debug_arr = np.frombuffer(debug_bytes, dtype=np.uint8)
                debug_bgr = cv2.imdecode(debug_arr, cv2.IMREAD_COLOR)
                cv2.imwrite(os.path.join(debug_dir, filename), debug_bgr)
            
            success_count += 1
            
        except Exception as e:
            print(f"Failed to analyze {filename}: {e}")
            continue
            
    print(f"Successfully preprocessed {success_count} images.")
    print(f"Preprocessed images and labels saved to {output_dir}")

if __name__ == '__main__':
    main()
