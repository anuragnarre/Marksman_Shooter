# apps/vision/pose_analyzer.py
import math
import os
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# Try new mediapipe Tasks API first, fall back to legacy solutions API
_USE_TASKS_API = False
_USE_SOLUTIONS_API = False

try:
    from mediapipe.tasks import python as mp_tasks
    from mediapipe.tasks.python import vision as mp_vision
    from mediapipe import solutions as mp_solutions
    _USE_TASKS_API = True
except (ImportError, AttributeError):
    pass

if not _USE_TASKS_API:
    try:
        import mediapipe as mp
        _pose_mod = getattr(mp, 'solutions', None)
        if _pose_mod and hasattr(_pose_mod, 'pose'):
            _USE_SOLUTIONS_API = True
    except ImportError:
        pass

MEDIAPIPE_AVAILABLE = _USE_TASKS_API or _USE_SOLUTIONS_API


def _angle(ax, ay, bx, by, cx, cy) -> float:
    """Compute angle at point b formed by a-b-c."""
    ba = (ax - bx, ay - by)
    bc = (cx - bx, cy - by)
    dot = ba[0] * bc[0] + ba[1] * bc[1]
    mag_ba = math.sqrt(ba[0] ** 2 + ba[1] ** 2)
    mag_bc = math.sqrt(bc[0] ** 2 + bc[1] ** 2)
    if mag_ba == 0 or mag_bc == 0:
        return 180.0
    cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return math.degrees(math.acos(cos_angle))


def _decode_image(image_bytes: bytes):
    """Decode image bytes to a BGR numpy array."""
    img_array = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img


def _analyze_with_tasks_api(image_bytes: bytes) -> dict:
    """Use the new mediapipe Tasks (PoseLandmarker) API."""
    import mediapipe as mp

    img = _decode_image(image_bytes)
    if img is None:
        return {"detected": False, "error": "Could not decode image"}

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    # Find the pose landmarker model
    model_path = os.path.join(os.path.dirname(__file__), "pose_landmarker_lite.task")

    # If model file doesn't exist, try to use the default bundled model
    if not os.path.exists(model_path):
        # Use the legacy solutions API as fallback if model not found
        return _analyze_with_solutions_api(image_bytes)

    options = mp_vision.PoseLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=model_path),
        running_mode=mp_vision.RunningMode.IMAGE,
        min_pose_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    with mp_vision.PoseLandmarker.create_from_options(options) as landmarker:
        result = landmarker.detect(mp_image)

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return {"detected": False}

        landmarks = result.pose_landmarks[0]
        return _compute_metrics(landmarks, use_tasks_format=True)


def _analyze_with_solutions_api(image_bytes: bytes) -> dict:
    """Use the legacy mp.solutions.pose API."""
    import mediapipe as mp

    mp_pose = mp.solutions.pose

    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        min_detection_confidence=0.5,
    ) as pose:
        img = _decode_image(image_bytes)
        if img is None:
            return {"detected": False, "error": "Could not decode image"}

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if not results.pose_landmarks:
            return {"detected": False}

        lm = results.pose_landmarks.landmark
        return _compute_metrics(lm, use_tasks_format=False)


def _compute_metrics(landmarks, use_tasks_format: bool) -> dict:
    """Compute posture metrics from landmarks (works with both APIs)."""
    if use_tasks_format:
        # Tasks API: landmarks is a list of NormalizedLandmark objects
        def get_x(i): return landmarks[i].x
        def get_y(i): return landmarks[i].y
        def get_z(i): return landmarks[i].z
        def get_vis(i): return landmarks[i].visibility if hasattr(landmarks[i], 'visibility') else 0.9
        count = len(landmarks)
    else:
        # Solutions API: landmarks is a list of landmark objects
        def get_x(i): return landmarks[i].x
        def get_y(i): return landmarks[i].y
        def get_z(i): return landmarks[i].z
        def get_vis(i): return landmarks[i].visibility
        count = 33

    # Left arm: shoulder (11) - elbow (13) - wrist (15)
    elbow_angle = _angle(
        get_x(11), get_y(11),
        get_x(13), get_y(13),
        get_x(15), get_y(15),
    )

    # Shoulder evenness
    shoulder_tilt = abs(get_y(11) - get_y(12)) * 100

    # Head tilt: nose (0) vs midpoint of shoulders
    shoulder_mid_y = (get_y(11) + get_y(12)) / 2
    head_tilt = abs(get_y(0) - shoulder_mid_y) * 100

    # Derive issues
    issues: list[str] = []
    if elbow_angle < 140:
        issues.append("Elbow too bent — risk of tremor")
    if shoulder_tilt > 5:
        issues.append("Shoulders uneven — check stance")
    if head_tilt > 12:
        issues.append("Head tilt detected — align with sights")

    score = max(0, 100 - len(issues) * 25 - int(shoulder_tilt * 2))

    keypoints = [
        [get_x(i), get_y(i), get_z(i), get_vis(i)]
        for i in range(min(count, 33))
    ]

    return {
        "detected": True,
        "postureScore": score,
        "elbowAngle": round(elbow_angle, 1),
        "shoulderTilt": round(shoulder_tilt, 2),
        "headTilt": round(head_tilt, 2),
        "issues": issues,
        "keypoints": keypoints,
    }


def analyze_pose(image_bytes: bytes) -> dict:
    """
    Analyze shooting stance from an image using MediaPipe Pose.

    Returns posture score, key angles, detected issues, and landmark keypoints.
    Supports both the new Tasks API and the legacy solutions API.
    """
    if not CV2_AVAILABLE:
        return {"detected": False, "error": "OpenCV is not installed"}

    if not MEDIAPIPE_AVAILABLE:
        return {
            "detected": False,
            "error": "MediaPipe is not installed on the vision service",
        }

    if _USE_TASKS_API:
        try:
            return _analyze_with_tasks_api(image_bytes)
        except Exception:
            # Fall through to solutions API
            if _USE_SOLUTIONS_API:
                return _analyze_with_solutions_api(image_bytes)
            raise

    return _analyze_with_solutions_api(image_bytes)
