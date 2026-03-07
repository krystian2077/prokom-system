"""Serializery produktów akcesoriów."""
from rest_framework import serializers
from apps.accessories.models import AccessoryProduct


class AccessoryProductListSerializer(serializers.ModelSerializer):
    """Krótka lista produktów."""
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = AccessoryProduct
        fields = ["id", "name", "sku", "category", "category_name", "price", "image", "is_active"]


class AccessoryProductSerializer(serializers.ModelSerializer):
    """Pełny serializer produktu (do wyboru przy upsell)."""
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = AccessoryProduct
        fields = [
            "id", "name", "sku", "category", "category_name",
            "description", "price", "image", "is_active",
            "compatible_device_categories", "sort_order",
        ]
