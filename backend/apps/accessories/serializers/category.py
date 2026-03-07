"""Serializery kategorii akcesoriów."""
from rest_framework import serializers
from apps.accessories.models import AccessoryCategory


class AccessoryCategorySerializer(serializers.ModelSerializer):
    """Kategoria akcesoriów (z liczbą produktów)."""
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = AccessoryCategory
        fields = ["id", "name", "slug", "description", "sort_order", "is_active", "product_count"]
        read_only_fields = fields

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()
