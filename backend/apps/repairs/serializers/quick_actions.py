"""Serializery szybkich akcji (dodaj notatkę, przypisz, odpowiedź na wycenę, szybkie przyjęcie)."""
from rest_framework import serializers
from apps.common.enums import DeviceCategory
from apps.repairs.models import RepairNote


class QuoteRespondSerializer(serializers.Serializer):
    """Body: odpowiedź klienta na wycenę (panel klienta)."""
    action = serializers.ChoiceField(choices=["accept", "reject"], required=True)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class AddRepairNoteSerializer(serializers.Serializer):
    """Body: dodaj notatkę do naprawy (szybka akcja)."""
    note = serializers.CharField(required=True, trim_whitespace=True, max_length=5000)
    is_internal = serializers.BooleanField(default=True)
    is_important = serializers.BooleanField(default=False)
    note_type = serializers.ChoiceField(
        choices=[c[0] for c in RepairNote.NOTE_TYPE_CHOICES],
        default="internal",
        required=False,
    )
    pinned = serializers.BooleanField(default=False, required=False)


class AssignRepairSerializer(serializers.Serializer):
    """Body: przypisz naprawę (szybka akcja). assigned_to_id pusty = przypisz do siebie."""
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)


class QuickAcceptSerializer(serializers.Serializer):
    """
    Szybkie przyjęcie (prokom.md): minimalne dane.
    Albo client_id + device_id, albo first_name, last_name, phone, email + device_category (+ opcjonalnie device_model_name).
    """
    problem_description = serializers.CharField(required=True, trim_whitespace=True, max_length=2000)
    client_id = serializers.UUIDField(required=False, allow_null=True)
    device_id = serializers.UUIDField(required=False, allow_null=True)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    device_category = serializers.ChoiceField(choices=DeviceCategory.choices, required=False, allow_null=True)
    device_model_name = serializers.CharField(required=False, allow_blank=True, max_length=200, default="Do uzupełnienia")

    def validate(self, attrs):
        has_existing = attrs.get("client_id") and attrs.get("device_id")
        has_new = all([
            attrs.get("first_name"),
            attrs.get("last_name"),
            attrs.get("phone"),
            attrs.get("email"),
            attrs.get("device_category"),
        ])
        if not has_existing and not has_new:
            raise serializers.ValidationError(
                "Podaj albo client_id i device_id (istniejące), albo first_name, last_name, phone, email i device_category."
            )
        return attrs


class MarkPackageReceivedSerializer(serializers.Serializer):
    """Oznaczenie odbioru paczki z urządzeniem (staff)."""
    package_ok = serializers.BooleanField(required=False, allow_null=True)
    request_number_attached = serializers.BooleanField(required=False, allow_null=True)
    package_notes = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    change_status_to = serializers.CharField(required=False, allow_null=True, allow_blank=True)
