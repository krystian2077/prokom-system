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
    repair_number = serializers.CharField(source="repair.repair_number", read_only=True)
    repair_device_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = PartUsage
        fields = [
            "id",
            "repair",
            "repair_number",
            "repair_device_name",
            "assigned_to_name",
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

    def get_repair_device_name(self, obj):
        repair = getattr(obj, "repair", None)
        if not repair:
            return ""
        device = getattr(repair, "device", None)
        if not device:
            return ""
        try:
            return device.get_device_name()
        except Exception:
            return ""

    def get_assigned_to_name(self, obj):
        user = getattr(obj.repair, "assigned_to", None)
        if not user:
            return None
        first = (getattr(user, "first_name", None) or "").strip()
        last = (getattr(user, "last_name", None) or "").strip()
        full = f"{first} {last}".strip()
        if full:
            return full
        return getattr(user, "email", None) or None


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
