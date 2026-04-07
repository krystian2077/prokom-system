"""Serializery dla Device (urządzenie klienta)."""
from rest_framework import serializers
from ..models import Device
from .device_model import DeviceModelListSerializer
from .brand import BrandListSerializer


class DeviceListSerializer(serializers.ModelSerializer):
    """Krótka lista urządzeń."""
    device_name = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()
    device_brand = serializers.SerializerMethodField()
    device_model = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            "id",
            "device_name",
            "brand_name",
            "device_brand",
            "device_model",
            "category",
            "client",
            "serial_number",
            "created_at",
        ]

    def get_device_name(self, obj):
        return obj.get_device_name()

    def get_brand_name(self, obj):
        return obj.get_brand_name()

    def get_device_brand(self, obj):
        return obj.get_brand_name()

    def get_device_model(self, obj):
        return obj.get_model_name()


class DeviceCreateUpdateSerializer(serializers.ModelSerializer):
    """Tworzenie i aktualizacja urządzenia."""

    class Meta:
        model = Device
        fields = [
            "id",
            "client",
            "category",
            "brand",
            "device_model",
            "model_name",
            "manual_device_name",
            "manual_brand",
            "manual_model",
            "serial_number",
            "imei",
            "condition_on_arrival",
            "has_screen_protector",
            "has_case",
            "accessories_included",
            "password",
            "notes",
        ]
        read_only_fields = ["id"]

    def validate_serial_number(self, value):
        if value:
            from apps.common.validators import validate_serial_number
            validate_serial_number(value)
        return value

    def validate_imei(self, value):
        if value:
            from apps.common.validators import validate_imei
            validate_imei(value)
        return value


class DeviceSerializer(serializers.ModelSerializer):
    """Pełny serializer urządzenia."""
    device_name = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()
    device_brand = serializers.SerializerMethodField()
    device_model_name = serializers.SerializerMethodField()
    brand = BrandListSerializer(read_only=True)
    device_model = DeviceModelListSerializer(read_only=True)

    class Meta:
        model = Device
        fields = [
            "id",
            "client",
            "category",
            "brand",
            "device_model",
            "model_name",
            "manual_device_name",
            "manual_brand",
            "manual_model",
            "device_name",
            "brand_name",
            "device_brand",
            "device_model_name",
            "serial_number",
            "imei",
            "condition_on_arrival",
            "has_screen_protector",
            "has_case",
            "accessories_included",
            "password",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_device_name(self, obj):
        return obj.get_device_name()

    def get_brand_name(self, obj):
        return obj.get_brand_name()

    def get_device_brand(self, obj):
        return obj.get_brand_name()

    def get_device_model_name(self, obj):
        return obj.get_model_name()

