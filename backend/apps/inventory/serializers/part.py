"""Serializery części (katalog + magazyn)."""
from rest_framework import serializers
from apps.inventory.models import Part
from .supplier import SupplierListSerializer


class PartListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    device_category_display = serializers.CharField(source="get_device_category_display", read_only=True)

    class Meta:
        model = Part
        fields = [
            "id",
            "name",
            "code",
            "device_category",
            "device_category_display",
            "brand",
            "device_model_name",
            "part_type",
            "quality_variant",
            "sell_price",
            "quantity_in_stock",
            "min_quantity",
            "unit",
            "category",
            "supplier",
            "supplier_name",
            "is_active",
        ]


class PartSerializer(serializers.ModelSerializer):
    supplier = SupplierListSerializer(read_only=True)
    device_category_display = serializers.CharField(source="get_device_category_display", read_only=True)

    class Meta:
        model = Part
        fields = [
            "id",
            "supplier",
            "name",
            "code",
            "device_category",
            "device_category_display",
            "brand",
            "device_model_name",
            "part_type",
            "quality_variant",
            "purchase_price",
            "sell_price",
            "quantity_in_stock",
            "min_quantity",
            "unit",
            "category",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]


class PartCreateUpdateSerializer(serializers.ModelSerializer):
    """Tworzenie/edycja części (katalog)."""

    class Meta:
        model = Part
        fields = [
            "name", "code", "device_category", "brand", "device_model_name",
            "part_type", "quality_variant", "supplier", "purchase_price", "sell_price",
            "quantity_in_stock", "min_quantity", "unit", "category", "notes", "is_active",
        ]
