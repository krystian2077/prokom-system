"""Serializery szybkich akcji (dodaj notatkę, przypisz, odpowiedź na wycenę, szybkie przyjęcie)."""
from rest_framework import serializers
from apps.common.enums import DeviceCategory
from apps.repairs.models import RepairNote


class QuoteRespondSerializer(serializers.Serializer):
    """Body: odpowiedź klienta na wycenę (panel klienta)."""
    action = serializers.ChoiceField(choices=["accept", "reject"], required=True)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class ClientRepairMessageCreateSerializer(serializers.Serializer):
    """Body: wiadomość od klienta w wątku przy naprawie (panel klienta)."""
    note = serializers.CharField(required=True, trim_whitespace=True, max_length=5000)


class SendClientEmailSerializer(serializers.Serializer):
    """Body: dowolny e-mail do klienta od pracownika (treść widoczna w historii jako log)."""
    subject = serializers.CharField(required=True, trim_whitespace=True, max_length=280)
    body = serializers.CharField(required=True, trim_whitespace=True, max_length=8000)


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
    - client_id + device_id — istniejący klient i urządzenie
    - client_id + device_category (bez device_id) — istniejący klient, nowe urządzenie
    - first_name, last_name, phone, device_category — nowy klient (+ opcjonalnie email; jeśli brak, backend ustawi placeholder)
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
    device_brand_name = serializers.CharField(required=False, allow_blank=True, max_length=100)

    manual_brand = serializers.CharField(required=False, allow_blank=True, max_length=100)
    device_color = serializers.CharField(required=False, allow_blank=True, max_length=64)
    visual_condition = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    device_password = serializers.CharField(required=False, allow_blank=True, max_length=100)
    accessory_etui = serializers.BooleanField(required=False, default=False)
    accessory_sim = serializers.BooleanField(required=False, default=False)
    accessory_charger = serializers.BooleanField(required=False, default=False)
    accessory_cable = serializers.BooleanField(required=False, default=False)
    accessory_box = serializers.BooleanField(required=False, default=False)
    internal_notes = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    estimated_cost = serializers.DecimalField(
        required=False, allow_null=True, max_digits=10, decimal_places=2
    )
    estimated_completion_date = serializers.DateField(required=False, allow_null=True)
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    unassigned_explicit = serializers.BooleanField(required=False, default=False)
    send_confirmation_email = serializers.BooleanField(required=False, default=False)
    hammer_glass_interest = serializers.ChoiceField(
        choices=["yes", "no"],
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        cid = attrs.get("client_id")
        did = attrs.get("device_id")
        cat = attrs.get("device_category")
        fn = (attrs.get("first_name") or "").strip()
        ln = (attrs.get("last_name") or "").strip()
        ph = (attrs.get("phone") or "").strip()

        has_existing_device = bool(cid and did)
        has_new_device_for_client = bool(cid and not did and cat)
        has_new_client = bool(fn and ln and ph and cat)

        if not (has_existing_device or has_new_device_for_client or has_new_client):
            raise serializers.ValidationError(
                "Podaj: (client_id i device_id) albo (client_id i device_category bez device_id) "
                "albo (imię, nazwisko, telefon i device_category dla nowego klienta)."
            )

        effective_cat = cat
        if has_existing_device and not effective_cat:
            from apps.devices.models import Device

            dev = Device.objects.filter(id=did, client_id=cid).first()
            if dev:
                effective_cat = dev.category

        hg = attrs.get("hammer_glass_interest")
        if effective_cat in ("phone", "tablet", "smartwatch"):
            if hg not in ("yes", "no"):
                raise serializers.ValidationError(
                    {
                        "hammer_glass_interest": (
                            "Dla telefonu, tableta lub smartwatcha wybierz zainteresowanie "
                            "folią Hammer Glass lub szkłem hartowanym (Tak / Nie)."
                        )
                    }
                )
        else:
            attrs["hammer_glass_interest"] = None

        if not (attrs.get("manual_brand") or "").strip() and (attrs.get("device_brand_name") or "").strip():
            attrs["manual_brand"] = (attrs.get("device_brand_name") or "").strip()

        return attrs


class QuickComplaintWarrantySerializer(serializers.Serializer):
    """
    Przyjęcie reklamacji / gwarancji (stacjonarne).
    - Reklamacja: wymagana naprawa nadrzędna (parent_repair_id lub parent_repair_number).
    - Gwarancja: opcjonalna naprawa nadrzędna; bez niej — imię, nazwisko, telefon, device_category (nowy klient).
    """

    repair_type = serializers.ChoiceField(choices=["complaint", "warranty"])
    problem_description = serializers.CharField(required=True, trim_whitespace=True, max_length=2000)
    parent_repair_id = serializers.UUIDField(required=False, allow_null=True)
    parent_repair_number = serializers.CharField(required=False, allow_blank=True, max_length=40)

    first_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    device_category = serializers.ChoiceField(choices=DeviceCategory.choices, required=False, allow_null=True)
    device_model_name = serializers.CharField(required=False, allow_blank=True, max_length=200, default="Do uzupełnienia")
    device_brand_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    manual_brand = serializers.CharField(required=False, allow_blank=True, max_length=100)
    device_color = serializers.CharField(required=False, allow_blank=True, max_length=64)
    visual_condition = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    device_password = serializers.CharField(required=False, allow_blank=True, max_length=100)
    accessory_etui = serializers.BooleanField(required=False, default=False)
    accessory_sim = serializers.BooleanField(required=False, default=False)
    accessory_charger = serializers.BooleanField(required=False, default=False)
    accessory_cable = serializers.BooleanField(required=False, default=False)
    accessory_box = serializers.BooleanField(required=False, default=False)
    internal_notes = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    estimated_cost = serializers.DecimalField(
        required=False, allow_null=True, max_digits=10, decimal_places=2
    )
    estimated_completion_date = serializers.DateField(required=False, allow_null=True)
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    unassigned_explicit = serializers.BooleanField(required=False, default=False)
    send_confirmation_email = serializers.BooleanField(required=False, default=False)
    hammer_glass_interest = serializers.ChoiceField(
        choices=["yes", "no"],
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        rt = attrs.get("repair_type")
        pid = attrs.get("parent_repair_id")
        pnum = (attrs.get("parent_repair_number") or "").strip()
        has_parent = bool(pid or pnum)

        fn = (attrs.get("first_name") or "").strip()
        ln = (attrs.get("last_name") or "").strip()
        ph = (attrs.get("phone") or "").strip()
        cat = attrs.get("device_category")

        if rt == "complaint" and not has_parent:
            raise serializers.ValidationError(
                "Reklamacja wymaga naprawy nadrzędnej: podaj parent_repair_id lub parent_repair_number."
            )

        if rt == "warranty" and not has_parent:
            if not (fn and ln and ph and cat):
                raise serializers.ValidationError(
                    "Gwarancja bez naprawy w systemie: podaj imię, nazwisko, telefon i kategorię urządzenia."
                )

        effective_cat = cat
        if rt == "complaint" or (rt == "warranty" and has_parent):
            attrs["hammer_glass_interest"] = None
        elif rt == "warranty" and not has_parent and effective_cat in ("phone", "tablet", "smartwatch"):
            hg = attrs.get("hammer_glass_interest")
            if hg not in ("yes", "no"):
                raise serializers.ValidationError(
                    {
                        "hammer_glass_interest": (
                            "Dla telefonu, tableta lub smartwatcha wybierz zainteresowanie "
                            "folią Hammer Glass lub szkłem hartowanym (Tak / Nie)."
                        )
                    }
                )
        else:
            attrs["hammer_glass_interest"] = None

        if not (attrs.get("manual_brand") or "").strip() and (attrs.get("device_brand_name") or "").strip():
            attrs["manual_brand"] = (attrs.get("device_brand_name") or "").strip()

        return attrs


class MarkPackageReceivedSerializer(serializers.Serializer):
    """Oznaczenie odbioru paczki z urządzeniem (staff)."""
    package_ok = serializers.BooleanField(required=False, allow_null=True)
    request_number_attached = serializers.BooleanField(required=False, allow_null=True)
    package_notes = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    change_status_to = serializers.CharField(required=False, allow_null=True, allow_blank=True)
