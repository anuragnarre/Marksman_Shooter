import os
import glob
import cv2
import numpy as np
import random
import argparse

# Config
WINDOW_SIZE = (32, 32)
HOG_BLOCK_SIZE = (16, 16)
HOG_BLOCK_STRIDE = (8, 8)
HOG_CELL_SIZE = (8, 8)
HOG_NBINS = 9

def get_hog_descriptor():
    return cv2.HOGDescriptor(
        _winSize=WINDOW_SIZE,
        _blockSize=HOG_BLOCK_SIZE,
        _blockStride=HOG_BLOCK_STRIDE,
        _cellSize=HOG_CELL_SIZE,
        _nbins=HOG_NBINS
    )

def extract_samples(images_dir, labels_dir, num_neg_per_img=5):
    pos_samples = []
    neg_samples = []
    
    img_paths = glob.glob(os.path.join(images_dir, "*.jpg"))
    print(f"Found {len(img_paths)} images to process for HOG extraction.")
    
    for path in img_paths:
        stem = os.path.splitext(os.path.basename(path))[0]
        lbl_path = os.path.join(labels_dir, stem + ".txt")
        
        if not os.path.exists(lbl_path):
            continue
            
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            continue
            
        h, w = img.shape
        boxes = []
        
        with open(lbl_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 5:
                    _, cx_n, cy_n, w_n, h_n = map(float, parts)
                    cx = int(cx_n * w)
                    cy = int(cy_n * h)
                    bw = int(w_n * w)
                    bh = int(h_n * h)
                    
                    x1 = max(0, cx - bw//2)
                    y1 = max(0, cy - bh//2)
                    x2 = min(w, cx + bw//2)
                    y2 = min(h, cy + bh//2)
                    
                    if x2 > x1 and y2 > y1:
                        boxes.append((x1, y1, x2, y2))
                        
                        # Extract positive
                        pos_crop = img[y1:y2, x1:x2]
                        pos_crop = cv2.resize(pos_crop, WINDOW_SIZE)
                        pos_samples.append(pos_crop)
        
        # Extract negatives (random crops that don't overlap with positives significantly)
        attempts = 0
        neg_extracted = 0
        while neg_extracted < num_neg_per_img and attempts < 50:
            attempts += 1
            nx = random.randint(0, w - WINDOW_SIZE[0])
            ny = random.randint(0, h - WINDOW_SIZE[1])
            
            # Check overlap
            overlap = False
            for (bx1, by1, bx2, by2) in boxes:
                if (nx < bx2 and nx + WINDOW_SIZE[0] > bx1 and 
                    ny < by2 and ny + WINDOW_SIZE[1] > by1):
                    overlap = True
                    break
                    
            if not overlap:
                neg_crop = img[ny:ny+WINDOW_SIZE[1], nx:nx+WINDOW_SIZE[0]]
                neg_samples.append(neg_crop)
                neg_extracted += 1
                
    return pos_samples, neg_samples

def train_hog_svm(pos_samples, neg_samples, output_model="models/hog_svm.xml"):
    hog = get_hog_descriptor()
    
    print("Computing HOG features...")
    features = []
    labels = []
    
    for img in pos_samples:
        feat = hog.compute(img)
        features.append(feat.flatten())
        labels.append(1)
        
    for img in neg_samples:
        feat = hog.compute(img)
        features.append(feat.flatten())
        labels.append(0)
        
    features = np.array(features, dtype=np.float32)
    labels = np.array(labels, dtype=np.int32)
    
    print(f"Training SVM with {len(pos_samples)} positive and {len(neg_samples)} negative samples...")
    svm = cv2.ml.SVM_create()
    svm.setType(cv2.ml.SVM_C_SVC)
    svm.setKernel(cv2.ml.SVM_LINEAR)
    svm.setC(0.1)
    
    svm.train(features, cv2.ml.ROW_SAMPLE, labels)
    
    os.makedirs(os.path.dirname(output_model), exist_ok=True)
    svm.save(output_model)
    print(f"HOG+SVM Model saved to {output_model}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", default=r"D:\App and Hardware Project\App\Marksman\Marksman Training Data\processed\images\train")
    parser.add_argument("--labels", default=r"D:\App and Hardware Project\App\Marksman\Marksman Training Data\processed\labels\train")
    parser.add_argument("--out", default="models/hog_svm.xml")
    args = parser.parse_args()
    
    pos, neg = extract_samples(args.images, args.labels, num_neg_per_img=10)
    
    if len(pos) == 0:
        print("ERROR: No positive samples found. Check if labels exist.")
        return
        
    train_hog_svm(pos, neg, args.out)

if __name__ == '__main__':
    main()
