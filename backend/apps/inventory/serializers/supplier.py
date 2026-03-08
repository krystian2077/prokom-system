"""Serializery dostawców."""
from rest_framework import serializers
from apps.inventory.models import Supplier


class SupplierListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "nip", "phone", "email", "website_url", "is_active"]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "nip",
            "street",
            "city",
            "postal_code",
            "country",
            "phone",
            "email",
            "website_url",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
