"""Serializery dla modelu Client."""
from rest_framework import serializers
from apps.common.enums import ContactPreference, ClientType, ClientSegment
from ..models import Client


class ClientListSerializer(serializers.ModelSerializer):
    """Krótka lista klientów (lista, wyszukiwanie)."""
    full_name = serializers.SerializerMethodField()
    client_type_display = serializers.CharField(source="get_client_type_display", read_only=True)
    client_segment_display = serializers.CharField(source="get_client_segment_display", read_only=True)

    class Meta:
        model = Client
        fields = [
            "id",
            "client_number",
            "full_name",
            "email",
            "phone",
            "client_type",
            "client_type_display",
            "client_segment",
            "client_segment_display",
            "visit_count",
            "total_repairs",
            "created_at",
        ]
        read_only_fields = ["id", "client_number", "total_repairs", "visit_count", "created_at"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class ClientCreateUpdateSerializer(serializers.ModelSerializer):
    """Tworzenie i aktualizacja klienta (osoba prywatna / firma)."""

    class Meta:
        model = Client
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "client_type",
            "client_segment",
            "company_name",
            "nip",
            "contact_person",
            "company_email",
            "company_phone",
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
    client_type_display = serializers.CharField(source="get_client_type_display", read_only=True)
    client_segment_display = serializers.CharField(source="get_client_segment_display", read_only=True)

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
            "client_type",
            "client_type_display",
            "client_segment",
            "client_segment_display",
            "visit_count",
            "last_visit_at",
            "company_name",
            "nip",
            "contact_person",
            "company_email",
            "company_phone",
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
            "id", "client_number", "total_repairs", "total_spent", "visit_count",
            "created_at", "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_addresses(self, obj):
        from .address import ClientAddressSerializer
        return ClientAddressSerializer(obj.addresses.all(), many=True).data
