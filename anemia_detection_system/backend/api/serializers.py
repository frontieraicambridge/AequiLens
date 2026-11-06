from rest_framework import serializers

from .models import PatientRecord


class PatientRecordSerializer(serializers.ModelSerializer):
    """Serializer for the PatientRecord model."""

    class Meta:
        model = PatientRecord
        fields = '__all__'
        read_only_fields = ['risk_score', 'status']

