"""
Serializer formularza publicznego zgłoszenia naprawy.
Jeden payload: dane klienta + urządzenie + dostawa.
"""
from rest_framework import serializers
from apps.common.enums import DeviceCategory, DeliveryMethod, ReturnMethod, ContactPreference


class PublicSubmitClientSerializer(serializers.Serializer):
    """Dane klienta w formularzu publicznym."""
    first_name = serializers.CharField(max_length=100, required=True, trim_whitespace=True)
    last_name = serializers.CharField(max_length=100, required=True, trim_whitespace=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=20, required=True, trim_whitespace=True)
    preferred_contact = serializers.ChoiceField(
        choices=ContactPreference.choices,
        default=ContactPreference.EMAIL,
        required=False,
    )
    street = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    postal_code = serializers.CharField(max_length=10, required=False, allow_blank=True, default="")
    country = serializers.CharField(max_length=100, required=False, default="Polska")

    def validate_phone(self, value):
        if value:
            from apps.common.validators import validate_polish_phone
            validate_polish_phone(value)
        return value


class PublicSubmitDeviceSerializer(serializers.Serializer):
    """Dane urządzenia w formularzu publicznym."""
    category = serializers.ChoiceField(choices=DeviceCategory.choices, required=True)
    brand_id = serializers.UUIDField(required=False, allow_null=True)
    device_model_id = serializers.UUIDField(required=False, allow_null=True)
    model_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    serial_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    imei = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    problem_description = serializers.CharField(required=True, trim_whitespace=True)
    device_turns_on = serializers.BooleanField(required=False, allow_null=True)
    visual_condition_description = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, default="",
        help_text="Opis stanu wizualnego: rysy, pęknięcia, uszkodzenia obudowy.",
    )

    def validate(self, attrs):
        category = attrs.get("category")
        # Dla phone/tablet/smartwatch wymagane: model (nazwa lub wybór z listy)
        if category in (DeviceCategory.PHONE, DeviceCategory.TABLET, DeviceCategory.SMARTWATCH):
            if not (attrs.get("model_name") or "").strip() and not attrs.get("device_model_id"):
                raise serializers.ValidationError(
                    {"model": "Dla telefonu/tabletu/smartwatcha podaj nazwę modelu lub wybierz z listy."}
                )
        return attrs


class PublicRepairSubmitSerializer(serializers.Serializer):
    """Cały payload formularza publicznego."""
    client = PublicSubmitClientSerializer(required=True)
    device = PublicSubmitDeviceSerializer(required=True)
    delivery_method = serializers.ChoiceField(
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.IN_PERSON,
        required=False,
    )
    return_method = serializers.ChoiceField(
        choices=ReturnMethod.choices,
        default=ReturnMethod.IN_PERSON,
        required=False,
    )
    delivery_street = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    delivery_house_number = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    delivery_city = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    delivery_postal_code = serializers.CharField(max_length=10, required=False, allow_blank=True, default="")
    delivery_country = serializers.CharField(max_length=100, required=False, default="Polska")

    hammer_glass_interest = serializers.ChoiceField(
        choices=["yes", "no", "ask_later", "free_with_quote"],
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    accessory_interest = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text="Lista ID produktów akcesoriów (AccessoryProduct).",
    )
    accessory_choose_for_me = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Klient prosi o dobór akcesoriów przez serwis.",
    )
    accessory_wishlist = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=1000,
        help_text="Tekst od klienta: co dobrać (np. zasilacz, torba).",
    )
    additional_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=2000,
        help_text="Dodatkowe uwagi klienta (np. hasło, historia naprawy).",
    )

    def validate(self, attrs):
        delivery = attrs.get("delivery_method", DeliveryMethod.IN_PERSON)
        if delivery != DeliveryMethod.IN_PERSON:
            if not (attrs.get("delivery_street") or "").strip() or not (attrs.get("delivery_city") or "").strip():
                raise serializers.ValidationError(
                    {"delivery": "Przy wysyłce kurierem/paczkomatem podaj adres dostawy (ulica i miasto)."}
                )
        device = attrs.get("device", {})
        if not (device.get("model_name") or "").strip() and not device.get("device_model_id"):
            raise serializers.ValidationError(
                {"device": "Podaj nazwę modelu urządzenia lub wybierz model z listy."}
            )
        aid = attrs.get("accessory_interest", [])
        if aid:
            from apps.accessories.models import AccessoryProduct
            valid_ids = set(AccessoryProduct.objects.filter(id__in=aid, is_active=True).values_list("id", flat=True))
            invalid = [str(x) for x in aid if x not in valid_ids]
            if invalid:
                raise serializers.ValidationError(
                    {"accessory_interest": f"Nierozpoznane lub nieaktywne produkty: {invalid}"}
                )
        return attrs


class PublicRepairSubmitResponseSerializer(serializers.Serializer):
    """Odpowiedź po udanym zgłoszeniu (tylko do dokumentacji)."""
    repair_number = serializers.CharField()
    message = serializers.CharField()
    tracking_url = serializers.CharField(required=False)
