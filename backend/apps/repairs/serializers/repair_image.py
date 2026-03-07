"""Serializery dla RepairImage."""
from rest_framework import serializers
from ..models import RepairImage


class RepairImageSerializer(serializers.ModelSerializer):
    """Zdjęcie naprawy."""

    class Meta:
        model = RepairImage
        fields = [
            "id",
            "repair",
            "image",
            "caption",
            "image_type",
            "is_visible_to_client",
            "uploaded_by",
            "created_at",
        ]
        read_only_fields = ["id", "uploaded_by", "created_at"]
