"""Serializery typów robocizny."""
from rest_framework import serializers
from apps.pricing.models import LabourType


class LabourTypeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabourType
        fields = ["id", "name", "default_price", "estimated_minutes", "is_active"]


class LabourTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabourType
        fields = [
            "id",
            "name",
            "default_price",
            "estimated_minutes",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
