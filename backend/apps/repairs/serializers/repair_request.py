"""Serializery dla RepairRequest."""
from rest_framework import serializers
from apps.common.enums import RepairStatus
from apps.common.utils import get_public_repair_status
from ..models import RepairRequest, RepairImage
from apps.clients.serializers import ClientListSerializer
from apps.devices.serializers import DeviceListSerializer


class RepairRequestListSerializer(serializers.ModelSerializer):
    """Krótka lista zgłoszeń napraw."""
    client_name = serializers.SerializerMethodField()
    device_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = RepairRequest
        fields = [
            "id",
            "repair_number",
            "client",
            "client_name",
            "device",
            "device_name",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "payment_status",
            "payment_status_display",
            "assigned_to",
            "estimated_completion_date",
            "estimated_duration_days_min",
            "estimated_duration_days_max",
            "created_at",
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name()

    def get_device_name(self, obj):
        return obj.device.get_device_name()


class RepairRequestCreateSerializer(serializers.ModelSerializer):
    """Tworzenie zgłoszenia naprawy (formularz online / staff)."""

    class Meta:
        model = RepairRequest
        fields = [
            "client",
            "device",
            "problem_description",
            "delivery_method",
            "return_method",
            "delivery_address",
            "return_address",
            "priority",
            "is_urgent",
            "is_same_day",
            "is_warranty",
            "requires_data_backup",
            "source",
        ]
        extra_kwargs = {
            "source": {"default": "online"},
        }

    def validate(self, attrs):
        if attrs.get("delivery_method") != "in_person" and not attrs.get("delivery_address"):
            raise serializers.ValidationError(
                {"delivery_address": "Adres dostawy jest wymagany przy wysyłce."}
            )
        return attrs


class RepairStatusUpdateSerializer(serializers.Serializer):
    """Zmiana statusu naprawy (szybka akcja)."""
    new_status = serializers.ChoiceField(choices=RepairStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)


class RepairRequestStatusSerializer(serializers.ModelSerializer):
    """Minimalny serializer statusu (do pollingu w panelu klienta)."""
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    public_status = serializers.SerializerMethodField()

    class Meta:
        model = RepairRequest
        fields = [
            "repair_number",
            "status",
            "status_display",
            "public_status",
            "updated_at",
        ]

    def get_public_status(self, obj):
        return get_public_repair_status(obj.status)


class RepairImagePublicSerializer(serializers.ModelSerializer):
    """Zdjęcie naprawy (dla klienta — tylko pola widoczne)."""

    class Meta:
        model = RepairImage
        fields = ["id", "image", "caption", "image_type", "created_at"]


class RepairRequestSerializer(serializers.ModelSerializer):
    """Pełny serializer zgłoszenia naprawy (szczegóły)."""
    client = ClientListSerializer(read_only=True)
    device = DeviceListSerializer(read_only=True)
    client_name = serializers.SerializerMethodField()
    device_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)
    public_status = serializers.SerializerMethodField()
    estimated_duration_display = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    days_in_repair = serializers.IntegerField(read_only=True)
    can_be_picked_up = serializers.BooleanField(read_only=True)
    is_waiting_for_client_decision = serializers.BooleanField(read_only=True)
    images = serializers.SerializerMethodField()
    accessory_offers = serializers.SerializerMethodField()
    hammer_glass_offers = serializers.SerializerMethodField()

    class Meta:
        model = RepairRequest
        fields = [
            "id",
            "repair_number",
            "client",
            "client_name",
            "device",
            "device_name",
            "status",
            "status_display",
            "public_status",
            "priority",
            "priority_display",
            "payment_status",
            "payment_status_display",
            "internal_status",
            "assigned_to",
            "problem_description",
            "delivery_method",
            "return_method",
            "delivery_address",
            "return_address",
            "accepted_at",
            "estimated_completion_date",
            "estimated_duration_days_min",
            "estimated_duration_days_max",
            "estimated_duration_display",
            "completed_at",
            "ready_for_pickup_at",
            "picked_up_at",
            "is_urgent",
            "is_same_day",
            "is_warranty",
            "requires_data_backup",
            "data_backup_completed",
            "estimated_cost",
            "final_cost",
            "internal_notes",
            "source",
            "created_by",
            "created_at",
            "updated_at",
            "is_overdue",
            "days_in_repair",
            "can_be_picked_up",
            "is_waiting_for_client_decision",
            "images",
            "accessory_offers",
            "hammer_glass_offers",
        ]
        read_only_fields = [
            "id", "repair_number", "created_at", "updated_at",
            "accepted_at", "completed_at", "ready_for_pickup_at", "picked_up_at",
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name()

    def get_device_name(self, obj):
        return obj.device.get_device_name()

    def get_public_status(self, obj):
        return get_public_repair_status(obj.status)

    def get_estimated_duration_display(self, obj):
        return obj.get_estimated_duration_display()

    def get_images(self, obj):
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) == "client":
            qs = obj.images.filter(is_visible_to_client=True)
        else:
            qs = obj.images.all()
        return RepairImagePublicSerializer(qs, many=True, context=self.context).data

    def get_accessory_offers(self, obj):
        try:
            from apps.accessories.serializers import RepairAccessoryOfferSerializer
            return RepairAccessoryOfferSerializer(
                obj.accessory_offers.select_related("product", "offered_by").order_by("-offered_at"),
                many=True,
                context=self.context,
            ).data
        except Exception:
            return []

    def get_hammer_glass_offers(self, obj):
        try:
            from apps.hammer_glass.serializers import RepairHammerGlassOfferSerializer
            return RepairHammerGlassOfferSerializer(
                obj.hammer_glass_offers.select_related("product", "offered_by").order_by("-offered_at"),
                many=True,
                context=self.context,
            ).data
        except Exception:
            return []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) == "client":
            data.pop("internal_notes", None)
            data.pop("internal_status", None)
        return data
