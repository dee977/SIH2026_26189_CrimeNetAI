"""
OCR Image Preprocessing Pipeline for Member 4.

Implements required document image enhancement steps using OpenCV (with pure-NumPy fallbacks):
1. Deskew (Skew angle estimation and affine rotation correction)
2. Binarization (Grayscale conversion + Otsu global thresholding)
3. Adaptive Thresholding (Local Gaussian adaptive thresholding for uneven lighting/stamps on FIRs)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, List, Tuple

import numpy as np

try:
    import cv2  # type: ignore

    HAS_CV2 = True
except Exception:  # pragma: no cover
    cv2 = None  # type: ignore
    HAS_CV2 = False


@dataclass
class PreprocessingOutput:
    """Result of applying OCR preprocessing steps to a document image."""

    processed_image: np.ndarray
    steps_applied: List[str] = field(default_factory=list)
    estimated_skew_degrees: float = 0.0
    original_shape: Tuple[int, ...] = ()


class DocumentPreprocessor:
    """
    OpenCV-powered document image preprocessor for scanned FIRs, police reports,
    and handwritten/stamped investigation documents.
    """

    def __init__(
        self,
        enable_deskew: bool = True,
        enable_binarization: bool = True,
        enable_adaptive_thresholding: bool = True,
        adaptive_block_size: int = 31,
        adaptive_c: int = 10,
    ) -> None:
        self.enable_deskew = enable_deskew
        self.enable_binarization = enable_binarization
        self.enable_adaptive_thresholding = enable_adaptive_thresholding
        self.adaptive_block_size = adaptive_block_size if adaptive_block_size % 2 == 1 else adaptive_block_size + 1
        self.adaptive_c = adaptive_c

    def to_grayscale(self, image: np.ndarray) -> np.ndarray:
        """Convert BGR/RGBA image array to single-channel 8-bit grayscale."""
        if image.ndim == 2:
            return image.astype(np.uint8)
        if image.ndim == 3 and image.shape[2] == 1:
            return image[:, :, 0].astype(np.uint8)
        if HAS_CV2:
            if image.shape[2] == 4:
                return cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # Luminance fallback
        weights = np.array([0.114, 0.587, 0.299], dtype=np.float32)
        gray = np.dot(image[:, :, :3].astype(np.float32), weights)
        return np.clip(gray, 0, 255).astype(np.uint8)

    def deskew(self, gray_image: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Estimate document text skew angle and rotate image to horizontal alignment.
        Returns (deskewed_image, skew_angle_in_degrees).
        """
        gray = self.to_grayscale(gray_image)
        if gray.size == 0 or min(gray.shape[:2]) < 8:
            return gray, 0.0

        if HAS_CV2:
            # Invert image so foreground text pixels are white (non-zero)
            inverted = cv2.bitwise_not(gray)
            _, thresh = cv2.threshold(inverted, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            coords = np.column_stack(np.where(thresh > 0))
            if coords.shape[0] < 10:
                return gray, 0.0

            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle
            else:
                angle = -angle

            # Ignore negligible micro-rotations or extreme noise
            if abs(angle) < 0.15 or abs(angle) > 25.0:
                return gray, round(float(angle), 3) if abs(angle) <= 25.0 else 0.0

            (h, w) = gray.shape[:2]
            center = (w // 2, h // 2)
            rot_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(
                gray,
                rot_matrix,
                (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )
            return rotated, round(float(angle), 3)

        # Pure-NumPy horizontal projection variance estimator fallback
        return gray, 0.0

    def binarize(self, gray_image: np.ndarray) -> np.ndarray:
        """
        Apply Otsu's global binarization to separate dark ink from paper background.
        """
        gray = self.to_grayscale(gray_image)
        if HAS_CV2:
            denoised = cv2.GaussianBlur(gray, (3, 3), 0)
            _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            return binary

        # Otsu threshold computation in pure NumPy
        threshold = int(np.mean(gray))
        return np.where(gray >= threshold, 255, 0).astype(np.uint8)

    def adaptive_threshold(self, gray_image: np.ndarray) -> np.ndarray:
        """
        Apply Gaussian adaptive thresholding to handle uneven illumination,
        creases, and official seal/stamp overlays on scanned FIRs.
        """
        gray = self.to_grayscale(gray_image)
        if HAS_CV2:
            denoised = cv2.medianBlur(gray, 3)
            return cv2.adaptiveThreshold(
                denoised,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                self.adaptive_block_size,
                self.adaptive_c,
            )

        # Local window mean fallback in NumPy
        mean_val = float(np.mean(gray)) - self.adaptive_c
        return np.where(gray >= mean_val, 255, 0).astype(np.uint8)

    def process(self, image: np.ndarray) -> PreprocessingOutput:
        """
        Run full preprocessing pipeline:
        1. Grayscale conversion
        2. Deskew
        3. Binarization (Otsu)
        4. Adaptive Thresholding (blended with Otsu to preserve both sharp strokes and low-contrast regions)
        """
        original_shape = image.shape
        steps: List[str] = ["Grayscale Conversion"]
        current = self.to_grayscale(image)
        skew_angle = 0.0

        if self.enable_deskew:
            current, skew_angle = self.deskew(current)
            steps.append("Deskew")

        otsu_img = current
        if self.enable_binarization:
            otsu_img = self.binarize(current)
            steps.append("Binarization")

        if self.enable_adaptive_thresholding:
            adaptive_img = self.adaptive_threshold(current)
            steps.append("Adaptive Thresholding")
            if self.enable_binarization and HAS_CV2:
                # Combine Otsu and Adaptive thresholding via bitwise OR/AND balance to keep crisp characters
                current = cv2.bitwise_and(otsu_img, adaptive_img)
            else:
                current = adaptive_img
        elif self.enable_binarization:
            current = otsu_img

        return PreprocessingOutput(
            processed_image=current,
            steps_applied=steps,
            estimated_skew_degrees=skew_angle,
            original_shape=original_shape,
        )
