"""Serializery dla adresów klienta."""
from rest_framework import serializers
from ..models import ClientAddress


class ClientAddressSerializer(serializers.ModelSerializer):
    """Adres klienta (wysyłkowy, do faktury)."""

    class Meta:
        model = ClientAddress
        fields = [
            "id",
            "label",
            "street",
            "city",
            "postal_code",
            "country",
            "phone",
            "additional_info",
            "is_default",
        ]
