"""
Preprocessing utilities for the Anemia Detection ML engine.

Provides functions to transform raw images and clinical data into
tensors suitable for the AnemiaMultimodalNet model.
"""

import hashlib

import numpy as np
import torch
from PIL import Image
from torchvision import transforms


# Standard ImageNet normalization parameters
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Image transformation pipeline
image_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def process_image(image_path: str) -> torch.Tensor:
    """
    Load and preprocess an image for model inference.

    Opens the image from disk, resizes to 224x224, converts to a tensor,
    applies ImageNet normalization, and adds a batch dimension.

    Args:
        image_path: Absolute or relative path to the image file.

    Returns:
        A tensor of shape (1, 3, 224, 224).
    """
    img = Image.open(image_path).convert('RGB')
    tensor = image_transform(img)
    # Add batch dimension: (3, 224, 224) -> (1, 3, 224, 224)
    return tensor.unsqueeze(0)


def process_clinical_data(
    diagnosis_list: list,
    symptoms_text: str,
) -> torch.Tensor:
    """
    Convert clinical data into a fixed-size tensor for the tabular branch.

    This is a placeholder implementation that produces a deterministic
    128-dimensional feature vector from the input data using simple hashing.
    In production, this would be replaced with proper NLP embeddings and
    ICD-10 code encodings.

    Args:
        diagnosis_list: List of ICD-10 diagnosis codes (e.g., ["D50.0", "D50.9"]).
        symptoms_text: Free-text description of patient symptoms.

    Returns:
        A tensor of shape (1, 128).
    """
    # Create a deterministic seed from the input data
    combined = str(sorted(diagnosis_list)) + symptoms_text
    hash_bytes = hashlib.sha512(combined.encode('utf-8')).digest()

    # Convert hash bytes to a numpy array and expand to 128 dimensions
    # Use the hash to seed a reproducible random generator
    seed = int.from_bytes(hash_bytes[:4], 'big')
    rng = np.random.RandomState(seed)
    features = rng.randn(128).astype(np.float32)

    # Normalize to unit length for stability
    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm

    tensor = torch.from_numpy(features).unsqueeze(0)  # (1, 128)
    return tensor

