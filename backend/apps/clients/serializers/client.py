"""Serializery dla modelu Client."""
from rest_framework import serializers
from apps.common.enums import ContactPreference
from ..models import Client


class ClientListSerializer(serializers.ModelSerializer):
    """Krótka lista klientów (lista, wyszukiwanie)."""

    class Meta:
        model = Client
        fields = [
            "id",
            "client_number",
            "full_name",
            "email",
            "phone",
            "total_repairs",
            "created_at",
        ]
        read_only_fields = ["id", "client_number", "total_repairs", "created_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["full_name"] = instance.get_full_name()
        return data


class ClientCreateUpdateSerializer(serializers.ModelSerializer):
    """Tworzenie i aktualizacja klienta."""

    class Meta:
        model = Client
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "street",
            "city",
            "postal_code",
            "country",
            "preferred_contact",
            "accepts_marketing",
            "internal_notes",
            "is_vip",
            "is_blacklisted",
        ]
        read_only_fields = ["id"]

    def validate_phone(self, value):
        if value:
            from apps.common.validators import validate_polish_phone
            validate_polish_phone(value)
        return value


class ClientSerializer(serializers.ModelSerializer):
    """Pełny serializer klienta (szczegóły)."""
    full_name = serializers.SerializerMethodField()
    addresses = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            "id",
            "client_number",
            "full_name",
            "first_name",
            "last_name",
            "email",
            "phone",
            "street",
            "city",
            "postal_code",
            "country",
            "preferred_contact",
            "accepts_marketing",
            "internal_notes",
            "total_repairs",
            "total_spent",
            "is_vip",
            "is_blacklisted",
            "addresses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "client_number", "total_repairs", "total_spent",
            "created_at", "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_addresses(self, obj):
        from .address import ClientAddressSerializer
        return ClientAddressSerializer(obj.addresses.all(), many=True).data
