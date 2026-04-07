"""
Lekkie serializery wyników wyszukiwania (szybkie odpowiedzi).
"""
from rest_framework import serializers
from apps.clients.models import Client
from apps.repairs.models import RepairRequest
from apps.devices.models import Device


class GlobalSearchClientSerializer(serializers.ModelSerializer):
    """Klient w wynikach global / advanced. Firmy rozróżniamy po client_type."""
    full_name = serializers.SerializerMethodField()
    client_type_display = serializers.CharField(source="get_client_type_display", read_only=True)
    repair_count = serializers.SerializerMethodField()
    device_count = serializers.SerializerMethodField()
    last_repair_summary = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            "id", "client_number", "full_name", "first_name", "last_name",
            "email", "phone", "client_type", "client_type_display",
            "company_name", "nip", "visit_count", "last_visit_at",
            "repair_count", "device_count", "last_repair_summary", "badges",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_repair_count(self, obj):
        return getattr(obj, "_repair_count", obj.repairs.count() if hasattr(obj, "repairs") else 0)

    def get_device_count(self, obj):
        return getattr(obj, "_device_count", 0)

    def get_last_repair_summary(self, obj):
        last = getattr(obj, "_last_repair", None)
        if not last:
            return None
        return {
            "id": str(last.id),
            "repair_number": last.repair_number,
            "status": last.status,
            "device_name": last.device.get_device_name() if last.device else None,
        }

    def get_badges(self, obj):
        badges = []
        if getattr(obj, "visit_count", 0) >= 2:
            badges.append("klient_wraca")
        if getattr(obj, "client_type", None) == "business":
            badges.append("firma")
        return badges


class IntakeSearchClientSerializer(serializers.ModelSerializer):
    """Klient w Intake Search: z liczbą napraw, urządzeń, ostatnią naprawą, badge'ami."""
    full_name = serializers.SerializerMethodField()
    repair_count = serializers.SerializerMethodField()
    device_count = serializers.SerializerMethodField()
    last_repair_summary = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            "id", "client_number", "full_name", "first_name", "last_name",
            "email", "phone", "client_type", "company_name", "nip",
            "repair_count", "device_count", "last_repair_summary", "badges",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_repair_count(self, obj):
        return getattr(obj, "_repair_count", 0)

    def get_device_count(self, obj):
        return getattr(obj, "_device_count", 0)

    def get_last_repair_summary(self, obj):
        last = getattr(obj, "_last_repair", None)
        if not last:
            return None
        return {
            "id": str(last.id),
            "repair_number": last.repair_number,
            "status": last.status,
            "status_display": last.get_status_display(),
            "device_name": last.device.get_device_name() if last.device else None,
        }

    def get_badges(self, obj):
        badges = []
        if getattr(obj, "visit_count", 0) >= 2:
            badges.append("klient_wraca")
        if getattr(obj, "client_type", None) == "business":
            badges.append("firma")
        return badges


class GlobalSearchRepairSerializer(serializers.ModelSerializer):
    """Naprawa w wynikach wyszukiwania (lekki)."""
    repair_number = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    client_name = serializers.SerializerMethodField()
    device_name = serializers.SerializerMethodField()
    device_brand = serializers.SerializerMethodField()
    device_model = serializers.SerializerMethodField()
    repair_type = serializers.CharField(read_only=True)

    class Meta:
        model = RepairRequest
        fields = [
            "id", "repair_number", "status", "status_display", "repair_type",
            "client", "client_name", "device", "device_name", "device_brand", "device_model",
            "problem_description", "assigned_to", "created_at",
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name() if obj.client else None

    def get_device_name(self, obj):
        return obj.device.get_device_name() if obj.device else None

    def get_device_brand(self, obj):
        return obj.device.get_brand_name() if obj.device else None

    def get_device_model(self, obj):
        return obj.device.get_model_name() if obj.device else None


class GlobalSearchDeviceSerializer(serializers.ModelSerializer):
    """Urządzenie w wynikach wyszukiwania (lekki)."""
    device_name = serializers.SerializerMethodField()
    device_brand = serializers.SerializerMethodField()
    device_model = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    repair_count = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            "id", "device_name", "category", "serial_number", "imei",
            "client", "client_name", "repair_count", "created_at", "device_brand", "device_model",
        ]

    def get_device_name(self, obj):
        return obj.get_device_name()

    def get_device_brand(self, obj):
        return obj.get_brand_name()

    def get_device_model(self, obj):
        return obj.get_model_name()

    def get_client_name(self, obj):
        return obj.client.get_full_name() if obj.client else None

    def get_repair_count(self, obj):
        return getattr(obj, "_repair_count", 0)


class IntakeSearchDeviceSerializer(serializers.ModelSerializer):
    """Urządzenie klienta do szybkiego wyboru przy intake."""
    device_name = serializers.SerializerMethodField()
    device_brand = serializers.SerializerMethodField()
    device_model = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = ["id", "device_name", "device_brand", "device_model", "category", "serial_number", "imei", "client"]

    def get_device_name(self, obj):
        return obj.get_device_name()

    def get_device_brand(self, obj):
        return obj.get_brand_name()

    def get_device_model(self, obj):
        return obj.get_model_name()

