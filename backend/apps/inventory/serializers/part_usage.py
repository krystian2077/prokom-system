"""Serializery użycia części w naprawie."""
from rest_framework import serializers
from apps.inventory.models import PartUsage
from .part import PartListSerializer
from .supplier import SupplierListSerializer


class PartUsageSerializer(serializers.ModelSerializer):
    part = PartListSerializer(read_only=True)
    supplier_detail = SupplierListSerializer(source="supplier", read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    usage_status_display = serializers.CharField(source="get_usage_status_display", read_only=True)

    class Meta:
        model = PartUsage
        fields = [
            "id",
            "repair",
            "part",
            "supplier",
            "supplier_detail",
            "quantity",
            "purchase_cost",
            "unit_price_used",
            "total",
            "usage_status",
            "usage_status_display",
            "notes",
            "added_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PartUsageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartUsage
        fields = [
            "part", "supplier", "quantity", "purchase_cost", "unit_price_used",
            "usage_status", "notes",
        ]
        extra_kwargs = {
            "usage_status": {"default": "ordered"},
            "purchase_cost": {"required": False},
            "supplier": {"required": False},
        }

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Ilość musi być większa od zero.")
        return value
