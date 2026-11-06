"""
Inference logic for the Anemia Detection ML engine.

Orchestrates the end-to-end prediction pipeline: loads patient data from the
database, preprocesses images and clinical data, runs the model, and returns
the predicted risk score.
"""

import logging

import torch

from .model import AnemiaMultimodalNet
from .preprocess import process_clinical_data, process_image

logger = logging.getLogger(__name__)

# Global model instance (lazy-loaded)
_model_instance = None


def _get_model() -> AnemiaMultimodalNet:
    """
    Get or create the model instance (singleton pattern).

    The model is initialized with random weights since no pre-trained
    checkpoint is available. In production, this would load saved weights.
    """
    global _model_instance
    if _model_instance is None:
        logger.info("Initializing AnemiaMultimodalNet model...")
        _model_instance = AnemiaMultimodalNet()
        _model_instance.eval()  # Set to evaluation mode
        logger.info("Model initialized successfully.")
    return _model_instance


def run_prediction(patient_record_id: str) -> float:
    """
    Run anemia risk prediction for a given patient record.

    Fetches the PatientRecord from the database, preprocesses its images
    and clinical data, runs the multimodal model, and returns a risk score.

    Args:
        patient_record_id: UUID string of the PatientRecord to process.

    Returns:
        Float risk score between 0.0 and 1.0.

    Raises:
        PatientRecord.DoesNotExist: If the record ID is not found.
        FileNotFoundError: If image files are missing from disk.
    """
    # Import here to avoid circular imports with Django models
    from api.models import PatientRecord

    logger.info(f"Running prediction for record: {patient_record_id}")

    # Fetch the patient record from the database
    record = PatientRecord.objects.get(id=patient_record_id)

    # Preprocess images
    conjunctiva_tensor = process_image(record.conjunctiva_img.path)
    fingernail_tensor = process_image(record.fingernail_img.path)

    # Preprocess clinical data
    clinical_tensor = process_clinical_data(
        diagnosis_list=record.diagnosis_codes,
        symptoms_text=record.symptoms,
    )

    # Run the model
    model = _get_model()
    with torch.no_grad():
        output = model(conjunctiva_tensor, fingernail_tensor, clinical_tensor)

    # Extract the scalar risk score
    risk_score = output.item()

    logger.info(
        f"Prediction complete for record {patient_record_id}: "
        f"risk_score={risk_score:.4f}"
    )

    return risk_score

