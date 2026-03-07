"""Serializery użycia części w naprawie."""
from rest_framework import serializers
from apps.inventory.models import PartUsage
from .part import PartListSerializer


class PartUsageSerializer(serializers.ModelSerializer):
    part = PartListSerializer(read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PartUsage
        fields = [
            "id",
            "repair",
            "part",
            "quantity",
            "unit_price_used",
            "total",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PartUsageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartUsage
        fields = ["part", "quantity", "unit_price_used", "notes"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Ilość musi być większa od zera.")
        return value
