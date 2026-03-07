"""Serializery dla Brand."""
from rest_framework import serializers
from ..models import Brand


class BrandListSerializer(serializers.ModelSerializer):
    """Krótka lista marek."""

    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "is_active"]


class BrandSerializer(serializers.ModelSerializer):
    """Pełny serializer marki."""

    class Meta:
        model = Brand
        fields = [
            "id",
            "name",
            "slug",
            "logo",
            "is_active",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
