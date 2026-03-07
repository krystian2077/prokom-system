"""Serializery części."""
from rest_framework import serializers
from apps.inventory.models import Part
from .supplier import SupplierListSerializer


class PartListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Part
        fields = [
            "id",
            "name",
            "code",
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

    class Meta:
        model = Part
        fields = [
            "id",
            "supplier",
            "name",
            "code",
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
