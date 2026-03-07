"""Serializery typów folii Hammer Glass."""
from rest_framework import serializers
from apps.hammer_glass.models import HammerGlassFilmType


class HammerGlassFilmTypeSerializer(serializers.ModelSerializer):
    """Typ folii (Clear / Matt / Privacy)."""
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = HammerGlassFilmType
        fields = ["id", "name", "slug", "description", "sort_order", "is_active", "product_count"]
        read_only_fields = fields

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()
