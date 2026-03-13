# apps/vision/pose_analyzer.py
import math
import numpy as np

try:
    import mediapipe as mp
    import cv2
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False


def _angle(a, b, c) -> float:
    """Compute angle at point b formed by a-b-c in landmark space."""
    ba = (a.x - b.x, a.y - b.y)
    bc = (c.x - b.x, c.y - b.y)
    dot = ba[0] * bc[0] + ba[1] * bc[1]
    mag_ba = math.sqrt(ba[0] ** 2 + ba[1] ** 2)
    mag_bc = math.sqrt(bc[0] ** 2 + bc[1] ** 2)
    if mag_ba == 0 or mag_bc == 0:
        return 180.0
    cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return math.degrees(math.acos(cos_angle))


def analyze_pose(image_bytes: bytes) -> dict:
    """
    Analyze shooting stance from an image using MediaPipe Pose.

    Returns posture score, key angles, detected issues, and landmark keypoints.
    Falls back to a 'not detected' response if MediaPipe is unavailable or no
    pose is found.
    """
    if not MEDIAPIPE_AVAILABLE:
        return {
            "detected": False,
            "error": "MediaPipe is not installed on the vision service",
        }

    mp_pose = mp.solutions.pose  # type: ignore[attr-defined]

    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        min_detection_confidence=0.5,
    ) as pose:
        img_array = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            return {"detected": False, "error": "Could not decode image"}

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if not results.pose_landmarks:
            return {"detected": False}

        lm = results.pose_landmarks.landmark

        # Key angles
        # Left arm: shoulder (11) - elbow (13) - wrist (15)
        elbow_angle = _angle(lm[11], lm[13], lm[15])
        # Shoulder evenness: vertical difference between left (11) and right (12) shoulders
        shoulder_tilt = abs(lm[11].y - lm[12].y) * 100
        # Head tilt: nose (0) vs midpoint of shoulders
        shoulder_mid_y = (lm[11].y + lm[12].y) / 2
        head_tilt = abs(lm[0].y - shoulder_mid_y) * 100

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
            [lm[i].x, lm[i].y, lm[i].z, lm[i].visibility]
            for i in range(33)
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
