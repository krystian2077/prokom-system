"""Serializery szybkich akcji (dodaj notatkę, przypisz, odpowiedź na wycenę)."""
from rest_framework import serializers


class QuoteRespondSerializer(serializers.Serializer):
    """Body: odpowiedź klienta na wycenę (panel klienta)."""
    action = serializers.ChoiceField(choices=["accept", "reject"], required=True)


class AddRepairNoteSerializer(serializers.Serializer):
    """Body: dodaj notatkę do naprawy (szybka akcja)."""
    note = serializers.CharField(required=True, trim_whitespace=True, max_length=5000)
    is_internal = serializers.BooleanField(default=True)
    is_important = serializers.BooleanField(default=False)


class AssignRepairSerializer(serializers.Serializer):
    """Body: przypisz naprawę (szybka akcja). assigned_to_id pusty = przypisz do siebie."""
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
