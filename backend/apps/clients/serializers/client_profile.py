"""Serializer profilu klienta (dla endpointu /me/ — klient widzi swoje dane)."""
from rest_framework import serializers
from apps.clients.models import Client
from .address import ClientAddressSerializer


class ClientProfileSerializer(serializers.ModelSerializer):
    """Profil klienta bez pól wewnętrznych (internal_notes, is_vip, is_blacklisted)."""
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
            "total_repairs",
            "total_spent",
            "addresses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_addresses(self, obj):
        return ClientAddressSerializer(obj.addresses.all(), many=True).data


class ClientProfileUpdateSerializer(serializers.ModelSerializer):
    """Aktualizacja profilu przez klienta (tylko dozwolone pola)."""

    class Meta:
        model = Client
        fields = [
            "first_name",
            "last_name",
            "phone",
            "street",
            "city",
            "postal_code",
            "country",
            "preferred_contact",
            "accepts_marketing",
        ]

    def validate_phone(self, value):
        if value:
            from apps.common.validators import validate_polish_phone
            validate_polish_phone(value)
        return value
