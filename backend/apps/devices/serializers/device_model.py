"""Serializery dla DeviceModel."""
from rest_framework import serializers
from ..models import DeviceModel
from .brand import BrandListSerializer


class DeviceModelListSerializer(serializers.ModelSerializer):
    """Krótka lista modeli urządzeń."""
    brand_name = serializers.CharField(source="brand.name", read_only=True)

    class Meta:
        model = DeviceModel
        fields = [
            "id",
            "brand",
            "brand_name",
            "category",
            "name",
            "slug",
            "is_active",
        ]


class DeviceModelSerializer(serializers.ModelSerializer):
    """Pełny serializer modelu urządzenia."""
    brand = BrandListSerializer(read_only=True)

    class Meta:
        model = DeviceModel
        fields = [
            "id",
            "brand",
            "category",
            "name",
            "slug",
            "full_name",
            "release_year",
            "processor",
            "ram",
            "storage_options",
            "image",
            "is_active",
            "popularity_score",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "popularity_score", "created_at", "updated_at"]
