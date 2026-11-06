"""
Celery background tasks for the API app.

Handles asynchronous multimodal machine learning inference for
anemia risk prediction.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def predict_anemia_risk(self, record_id: str):
    """
    Celery background task to run anemia risk prediction.

    Fetches the PatientRecord by ID, runs the ML inference pipeline,
    and updates the database with the risk score and final status.

    Args:
        record_id: UUID string of the PatientRecord to process.

    Returns:
        dict with status and risk_score.
    """
    from .models import PatientRecord
    from .ml_engine.predict import run_prediction

    logger.info(f"[Celery] Starting prediction task for record: {record_id}")

    try:
        # Fetch the patient record
        record = PatientRecord.objects.get(id=record_id)

        # Run inference through the ML engine
        risk_score = run_prediction(record_id)

        # Update the record with results
        record.risk_score = risk_score
        record.status = 'COMPLETED'
        record.save(update_fields=['risk_score', 'status'])

        logger.info(
            f"[Celery] Prediction succeeded for record {record_id}: "
            f"risk_score={risk_score:.4f}, status=COMPLETED"
        )
        return {'status': 'COMPLETED', 'risk_score': risk_score}

    except PatientRecord.DoesNotExist:
        logger.error(f"[Celery] PatientRecord with ID {record_id} does not exist.")
        return {'status': 'FAILED', 'error': 'Record not found'}

    except Exception as exc:
        logger.error(
            f"[Celery] Prediction failed for record {record_id}: {exc}",
            exc_info=True,
        )

        # Attempt to mark the record as FAILED in the DB
        try:
            record = PatientRecord.objects.get(id=record_id)
            record.status = 'FAILED'
            record.save(update_fields=['status'])
        except Exception:
            logger.error(f"[Celery] Could not update status to FAILED for record {record_id}")

        # Re-raise for Celery task failure tracking
        raise exc

