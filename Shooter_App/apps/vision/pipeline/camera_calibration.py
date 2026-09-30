import cv2
import numpy as np

def calibrate_and_undistort(img: np.ndarray, camera_matrix: np.ndarray, dist_coeffs: np.ndarray) -> np.ndarray:
    """
    Applies standard lens distortion correction (undistort) using camera intrinsics.
    Crucial for cheap ESP32 lenses which have heavy barrel distortion.
    """
    h, w = img.shape[:2]
    # Refine camera matrix based on image size
    new_camera_matrix, roi = cv2.getOptimalNewCameraMatrix(camera_matrix, dist_coeffs, (w, h), 1, (w, h))
    
    # Undistort
    undistorted = cv2.undistort(img, camera_matrix, dist_coeffs, None, new_camera_matrix)
    
    # Crop the image based on ROI if needed, though for target analysis 
    # we often want the full warped view even if edges are black.
    x, y, w, h = roi
    if w > 0 and h > 0:
        undistorted = undistorted[y:y+h, x:x+w]
        
    return undistorted

def get_default_esp32_intrinsics(width: int, height: int):
    """
    Returns rough estimate intrinsic matrix and distortion coefficients 
    for a typical OV2640 (standard ESP32-CAM sensor) with a ~65 degree FOV lens.
    For millimeter accuracy, a real checkerboard calibration should be performed.
    """
    # Focal length estimation: roughly equivalent to pixel width for standard webcams
    focal_length = width * 0.9 
    center_x = width / 2
    center_y = height / 2

    camera_matrix = np.array([
        [focal_length, 0, center_x],
        [0, focal_length, center_y],
        [0, 0, 1]
    ], dtype=np.float32)

    # k1 is heavily negative causing barrel distortion.
    dist_coeffs = np.array([-0.25, 0.05, 0.0, 0.0, 0.0], dtype=np.float32)

    return camera_matrix, dist_coeffs


def get_generic_android_intrinsics(width: int, height: int):
    """
    Returns rough estimate intrinsic matrix and distortion coefficients
    for an older, generic Android smartphone camera exhibiting macro barrel distortion.
    """
    focal_length = max(width, height) * 0.8
    center_x = width / 2
    center_y = height / 2

    camera_matrix = np.array([
        [focal_length, 0, center_x],
        [0, focal_length, center_y],
        [0, 0, 1]
    ], dtype=np.float32)

    # Mild barrel distortion typical of older phone lenses at close range
    dist_coeffs = np.array([-0.10, 0.02, 0.0, 0.0, 0.0], dtype=np.float32)

    return camera_matrix, dist_coeffs
