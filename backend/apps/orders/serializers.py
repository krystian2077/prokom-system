"""Serializery modułu zamówień (admin)."""
from rest_framework import serializers
from .models import OrderProductCategory, OrderProduct, CustomerOrder, StoreSupplyOrder


class OrderProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderProductCategory
        fields = ["id", "name", "sort_order", "is_active", "created_at", "updated_at"]


class OrderProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = OrderProduct
        fields = [
            "id", "name", "ean", "category", "category_name", "brand", "product_type",
            "notes", "is_active", "created_at", "updated_at",
        ]


class OrderProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderProduct
        fields = [
            "id", "name", "ean", "category", "brand", "product_type",
            "notes", "is_active", "created_at", "updated_at",
        ]


class CustomerOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="display_product_name", read_only=True)
    product_name_manual = serializers.CharField(source="product_name_override", required=False, allow_blank=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    margin = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    margin_percent = serializers.SerializerMethodField()

    class Meta:
        model = CustomerOrder
        fields = [
            "id", "client", "contact_phone", "contact_email",
            "product", "product_name_manual", "product_name", "quantity",
            "purchase_price", "sell_price", "margin", "margin_percent",
            "supplier", "planned_order_date", "expected_delivery_date",
            "status", "status_display", "notes", "deposit_amount", "client_notified",
            "picked_up_at", "related_repair", "created_by", "created_at", "updated_at",
            "deposit_paid", "urgent", "client_waiting", "requires_contact", "overdue",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_margin_percent(self, obj):
        val = obj.margin_percent
        return round(val, 2) if val is not None else None


class StoreSupplyOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="display_product_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        model = StoreSupplyOrder
        fields = [
            "id", "product", "product_name_manual", "product_name", "quantity", "supplier", "estimated_cost",
            "priority", "priority_display", "status", "status_display",
            "notes", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, data):
        if not data.get("product") and not data.get("product_name_manual", "").strip():
            raise serializers.ValidationError(
                {"product": "Podaj produkt z katalogu lub nazwę ręcznie (product_name_manual)."}
            )
        return data
