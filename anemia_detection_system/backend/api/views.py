from rest_framework import viewsets

from .models import PatientRecord
from .serializers import PatientRecordSerializer


class PatientRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PatientRecord CRUD operations.

    On creation, the record is saved and a Celery task is dispatched
    to run the ML prediction asynchronously.
    """

    queryset = PatientRecord.objects.all()
    serializer_class = PatientRecordSerializer

    def perform_create(self, serializer):
        instance = serializer.save()

        # Dispatch the async ML prediction task
        from .tasks import predict_anemia_risk
        predict_anemia_risk.delay(str(instance.id))

        # Update status to PROCESSING
        instance.status = 'PROCESSING'
        instance.save(update_fields=['status'])
