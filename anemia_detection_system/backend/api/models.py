import uuid

from django.db import models


class PatientRecord(models.Model):
    """Model representing a patient record for anemia detection analysis."""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.CharField(max_length=100, db_index=True)
    sample_id = models.CharField(max_length=100, db_index=True)
    conjunctiva_img = models.ImageField(upload_to='images/conjunctiva/')
    fingernail_img = models.ImageField(upload_to='images/fingernails/')
    diagnosis_codes = models.JSONField(default=list)
    symptoms = models.TextField()
    risk_score = models.FloatField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PatientRecord({self.patient_id} / {self.sample_id}) - {self.status}"

    class Meta:
        ordering = ['-created_at']
