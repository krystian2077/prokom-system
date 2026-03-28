"""Serializery użycia części w naprawie."""
from rest_framework import serializers
from apps.inventory.models import PartUsage
from apps.inventory.models.part_usage import PartOrderStatus, PartUsageStatus
from .part import PartListSerializer
from .supplier import SupplierListSerializer


class PartUsageSerializer(serializers.ModelSerializer):
    part = PartListSerializer(read_only=True, allow_null=True)
    supplier_detail = SupplierListSerializer(source="supplier", read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    usage_status_display = serializers.CharField(source="get_usage_status_display", read_only=True)
    order_status_display = serializers.CharField(source="get_order_status_display", read_only=True)
    repair_number = serializers.CharField(source="repair.repair_number", read_only=True)
    repair_device_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = PartUsage
        fields = [
            "id",
            "repair",
            "repair_number",
            "repair_device_name",
            "assigned_to_name",
            "part",
            "custom_part_name",
            "supplier",
            "supplier_detail",
            "quantity",
            "purchase_cost",
            "unit_price_used",
            "total",
            "usage_status",
            "usage_status_display",
            "order_status",
            "order_status_display",
            "ordered_at",
            "expected_arrival_date",
            "notes",
            "added_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_repair_device_name(self, obj):
        repair = getattr(obj, "repair", None)
        if not repair:
            return ""
        device = getattr(repair, "device", None)
        if not device:
            return ""
        try:
            return device.get_device_name()
        except Exception:
            return ""

    def get_assigned_to_name(self, obj):
        user = getattr(obj.repair, "assigned_to", None)
        if not user:
            return None
        first = (getattr(user, "first_name", None) or "").strip()
        last = (getattr(user, "last_name", None) or "").strip()
        full = f"{first} {last}".strip()
        if full:
            return full
        return getattr(user, "email", None) or None


class PartUsageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartUsage
        fields = [
            "part",
            "custom_part_name",
            "supplier",
            "quantity",
            "purchase_cost",
            "unit_price_used",
            "usage_status",
            "order_status",
            "expected_arrival_date",
            "notes",
        ]
        extra_kwargs = {
            "usage_status": {"default": PartUsageStatus.ORDERED},
            "order_status": {"default": PartOrderStatus.TO_ORDER},
            "purchase_cost": {"required": False},
            "supplier": {"required": False},
            "expected_arrival_date": {"required": False, "allow_null": True},
            "part": {"required": False, "allow_null": True},
            "custom_part_name": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        part = attrs.get("part")
        custom = (attrs.get("custom_part_name") or "").strip()
        if part is not None:
            attrs["custom_part_name"] = ""
            return attrs
        if custom:
            attrs["custom_part_name"] = custom
            attrs["part"] = None
            return attrs
        raise serializers.ValidationError(
            "Podaj część z katalogu albo nazwę własną (pole custom_part_name)."
        )

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Ilość musi być większa od zero.")
        return value


class PartUsageUpdateSerializer(serializers.ModelSerializer):
    """Częściowa aktualizacja pozycji (status zamówienia / użycia)."""

    class Meta:
        model = PartUsage
        fields = [
            "usage_status",
            "order_status",
            "notes",
            "supplier",
            "purchase_cost",
            "expected_arrival_date",
        ]

    def validate(self, attrs):
        usage_status = attrs.get("usage_status", self.instance.usage_status if self.instance else None)
        if usage_status == PartUsageStatus.ARRIVED:
            attrs["order_status"] = PartOrderStatus.ARRIVED
        return attrs

    def update(self, instance, validated_data):
        from django.utils import timezone

        instance = super().update(instance, validated_data)
        request = self.context.get("request")
        if instance.order_status in (PartOrderStatus.ORDERED, PartOrderStatus.DELAYED):
            if not instance.ordered_at:
                instance.ordered_at = timezone.now()
                if request and request.user.is_authenticated:
                    instance.ordered_by = request.user
                instance.save(update_fields=["ordered_at", "ordered_by", "updated_at"])
        return instance
