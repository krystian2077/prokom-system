"""Serializery produktów Hammer Glass."""
from rest_framework import serializers
from apps.hammer_glass.models import HammerGlassProduct


class HammerGlassProductListSerializer(serializers.ModelSerializer):
    """Krótka lista produktów."""
    film_type_name = serializers.CharField(source="film_type.name", read_only=True)
    protection_level_display = serializers.CharField(source="get_protection_level_display", read_only=True)

    class Meta:
        model = HammerGlassProduct
        fields = [
            "id", "name", "sku", "film_type", "film_type_name",
            "price", "protection_level", "protection_level_display", "features", "image", "is_active",
        ]


class HammerGlassProductSerializer(serializers.ModelSerializer):
    """Pełny serializer produktu (do wyboru przy upsell)."""
    film_type_name = serializers.CharField(source="film_type.name", read_only=True)
    protection_level_display = serializers.CharField(source="get_protection_level_display", read_only=True)

    class Meta:
        model = HammerGlassProduct
        fields = [
            "id", "name", "sku", "film_type", "film_type_name",
            "description", "price", "protection_level", "protection_level_display", "features",
            "image", "is_active", "compatible_device_categories", "sort_order",
        ]
