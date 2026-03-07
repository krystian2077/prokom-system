"""Serializery dla zgód klienta."""
from rest_framework import serializers
from ..models import ClientConsent


class ClientConsentSerializer(serializers.ModelSerializer):
    """Zgody klienta (RODO, kontakt, regulamin itd.)."""

    class Meta:
        model = ClientConsent
        fields = [
            "id",
            "consent_type",
            "is_granted",
            "consent_text",
            "granted_at",
            "withdrawn_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
