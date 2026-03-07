"""Serializery zamówień zakupu."""
from rest_framework import serializers
from apps.inventory.models import PurchaseOrder, PurchaseOrderItem
from .supplier import SupplierListSerializer
from .part import PartListSerializer


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    part = PartListSerializer(read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "order", "part", "quantity", "unit_price"]


class PurchaseOrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ["part", "quantity", "unit_price"]


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "order_number",
            "supplier",
            "supplier_name",
            "status",
            "ordered_at",
            "expected_at",
            "created_at",
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier = SupplierListSerializer(read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "order_number",
            "supplier",
            "status",
            "ordered_at",
            "expected_at",
            "received_at",
            "notes",
            "created_by",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["order_number", "created_at", "updated_at"]
