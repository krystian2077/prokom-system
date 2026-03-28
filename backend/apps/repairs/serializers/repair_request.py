"""Serializery dla RepairRequest."""
from rest_framework import serializers
from apps.common.enums import RepairStatus
from apps.common.utils import get_public_repair_status
from ..models import RepairRequest, RepairImage
from apps.clients.serializers import ClientListSerializer
from apps.devices.serializers import DeviceListSerializer


class RelatedComplaintWarrantySerializer(serializers.ModelSerializer):
    """Minimalny serializer dla powiązanych reklamacji/gwarancji (w szczegółach naprawy)."""
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    complaint_warranty_status_display = serializers.SerializerMethodField()

    class Meta:
        model = RepairRequest
        fields = [
            "id", "repair_number", "repair_type", "status", "status_display",
            "complaint_warranty_status", "complaint_warranty_status_display",
            "created_at",
        ]

    def get_complaint_warranty_status_display(self, obj):
        if not obj.complaint_warranty_status:
            return None
        from apps.common.enums import ComplaintWarrantyStatus
        return dict(ComplaintWarrantyStatus.choices).get(obj.complaint_warranty_status, obj.complaint_warranty_status)


class RepairRequestListSerializer(serializers.ModelSerializer):
    """Krótka lista zgłoszeń napraw."""
    client_name = serializers.SerializerMethodField()
    device_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)
    auto_tags = serializers.SerializerMethodField()
    waiting_for_client_days = serializers.SerializerMethodField()
    complaint_warranty_status_display = serializers.SerializerMethodField()
    parent_repair_number = serializers.SerializerMethodField()
    created_by_label = serializers.SerializerMethodField()

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
            "staff_planned_work_date",
            "estimated_duration_days_min",
            "estimated_duration_days_max",
            "is_incomplete",
            "repair_type",
            "requires_attention",
            "complaint_warranty_status",
            "complaint_warranty_status_display",
            "auto_tags",
            "waiting_for_client_days",
            "delivery_method",
            "return_method",
            "problem_description",
            "parent_repair_number",
            "created_by_label",
            "created_at",
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name()

    def get_device_name(self, obj):
        return obj.device.get_device_name()

    def get_auto_tags(self, obj):
        return getattr(obj, "get_auto_tags", lambda: [])()

    def get_waiting_for_client_days(self, obj):
        return getattr(obj, "waiting_for_client_days", None)

    def get_complaint_warranty_status_display(self, obj):
        if not obj.complaint_warranty_status:
            return None
        from apps.common.enums import ComplaintWarrantyStatus

        return dict(ComplaintWarrantyStatus.choices).get(
            obj.complaint_warranty_status, obj.complaint_warranty_status
        )

    def get_parent_repair_number(self, obj):
        pr = obj.parent_repair
        return pr.repair_number if pr else None

    def get_created_by_label(self, obj):
        u = obj.created_by
        if not u:
            return None
        fn = (getattr(u, "first_name", None) or "").strip()
        ln = (getattr(u, "last_name", None) or "").strip()
        full = f"{fn} {ln}".strip()
        return full or getattr(u, "email", None) or str(u.pk)


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
            "parent_repair",
            "repair_type",
            "assigned_to",
        ]
        extra_kwargs = {
            "source": {"default": "online"},
            "parent_repair": {"required": False},
            "repair_type": {"default": "standard"},
            "assigned_to": {"required": False},
        }

    def validate(self, attrs):
        if attrs.get("delivery_method") != "in_person" and not attrs.get("delivery_address"):
            raise serializers.ValidationError(
                {"delivery_address": "Adres dostawy jest wymagany przy wysyłce."}
            )
        if attrs.get("repair_type") == "complaint" and not attrs.get("parent_repair"):
            raise serializers.ValidationError(
                {"parent_repair": "Reklamacja wymaga wskazania naprawy nadrzędnej."}
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
    health_score = serializers.SerializerMethodField()
    health_issues = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    accessory_offers = serializers.SerializerMethodField()
    hammer_glass_offers = serializers.SerializerMethodField()
    accessory_choose_for_me = serializers.SerializerMethodField()
    accessory_wishlist = serializers.SerializerMethodField()
    related_complaints_warranties = serializers.SerializerMethodField()
    auto_tags = serializers.SerializerMethodField()
    waiting_for_client_days = serializers.SerializerMethodField()

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
            "staff_planned_work_date",
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
            "is_incomplete",
            "parent_repair",
            "repair_type",
            "requires_attention",
            "last_client_message_at",
            "last_staff_reply_at",
            "last_activity_at",
            "complaint_warranty_status",
            "package_received_at",
            "package_received_by",
            "package_ok",
            "request_number_attached",
            "package_notes",
            "package_photo",
            "created_by",
            "created_at",
            "updated_at",
            "is_overdue",
            "days_in_repair",
            "can_be_picked_up",
            "is_waiting_for_client_decision",
            "health_score",
            "health_issues",
            "images",
            "accessory_offers",
            "hammer_glass_offers",
            "related_complaints_warranties",
            "auto_tags",
            "waiting_for_client_days",
            "quote_sent_at",
            "hammer_glass_interest",
            "accessory_choose_for_me",
            "accessory_wishlist",
            "client_notes",
            "device_turns_on",
            "visual_condition_description",
            "client_tracking_number",
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

    def get_health_score(self, obj):
        from apps.repairs.services.health_score import get_repair_health_score
        level, _ = get_repair_health_score(obj)
        return level

    def get_health_issues(self, obj):
        from apps.repairs.services.health_score import get_repair_health_score
        _, issues = get_repair_health_score(obj)
        return issues

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

    def get_accessory_choose_for_me(self, obj):
        """Czy klient wybrał w formularzu „Dobierz mi akcesoria”."""
        if not obj.id:
            return False
        return getattr(obj, "accessory_interests", None) and obj.accessory_interests.filter(choose_for_me=True).exists()

    def get_accessory_wishlist(self, obj):
        """Tekst od klienta: co dobrać (z formularza zgłoszenia)."""
        if not obj.id or not getattr(obj, "accessory_interests", None):
            return None
        interest = obj.accessory_interests.filter(choose_for_me=True).order_by("created_at").first()
        if interest and getattr(interest, "note", None) and interest.note.strip():
            return interest.note.strip()
        return None

    def get_related_complaints_warranties(self, obj):
        """Powiązane reklamacje i gwarancje (dla naprawy źródłowej)."""
        if not obj.id:
            return []
        children = obj.complaint_repairs.order_by("-created_at")
        return RelatedComplaintWarrantySerializer(children, many=True, context=self.context).data

    def get_auto_tags(self, obj):
        return getattr(obj, "get_auto_tags", lambda: [])()

    def get_waiting_for_client_days(self, obj):
        return getattr(obj, "waiting_for_client_days", None)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) == "client":
            data.pop("internal_notes", None)
            data.pop("internal_status", None)
            data.pop("related_complaints_warranties", None)
        return data
