"""Serializery pakietów akcesoriów."""
from rest_framework import serializers
from apps.accessories.models import AccessoryBundle, AccessoryBundleItem, AccessoryProduct


class AccessoryBundleItemSerializer(serializers.ModelSerializer):
    """Pozycja pakietu z ceną i produktem."""
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = AccessoryBundleItem
        fields = [
            "id", "product", "product_name", "product_sku",
            "quantity", "fixed_price", "unit_price", "line_total",
        ]

    def get_unit_price(self, obj):
        return obj.unit_price

    def get_line_total(self, obj):
        return obj.line_total


class AccessoryBundleListSerializer(serializers.ModelSerializer):
    """Lista pakietów z wyliczoną sumą (do optymalizacji: annotate w view)."""
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = AccessoryBundle
        fields = ["id", "name", "slug", "description", "is_active", "sort_order", "total_price"]

    def get_total_price(self, obj):
        total = sum(
            (item.fixed_price if item.fixed_price is not None else item.product.price) * item.quantity
            for item in obj.items.select_related("product").all()
        )
        return total


class AccessoryBundleSerializer(serializers.ModelSerializer):
    """Szczegóły pakietu z pozycjami."""
    items = AccessoryBundleItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = AccessoryBundle
        fields = ["id", "name", "slug", "description", "is_active", "sort_order", "items", "total_price"]

    def get_total_price(self, obj):
        total = sum(
            (item.fixed_price if item.fixed_price is not None else item.product.price) * item.quantity
            for item in obj.items.select_related("product").all()
        )
        return total
