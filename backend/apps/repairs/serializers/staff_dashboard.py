"""Serializery dashboardu staff i ostatniej aktywności."""
from rest_framework import serializers
from apps.repairs.models import RepairStatusHistory


class RecentActivityEntrySerializer(serializers.Serializer):
    """Jedna pozycja ostatniej aktywności (zmiana statusu przeze mnie)."""
    repair_id = serializers.UUIDField(source="repair.id", read_only=True)
    repair_number = serializers.CharField(source="repair.repair_number", read_only=True)
    old_status = serializers.CharField(read_only=True)
    new_status = serializers.CharField(read_only=True)
    new_status_display = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    changed_by_id = serializers.UUIDField(source="changed_by.id", read_only=True)
    notes = serializers.CharField(read_only=True)
    client_name = serializers.SerializerMethodField()

    def get_new_status_display(self, obj):
        return obj.repair.get_status_display() if obj.repair else ""

    def get_client_name(self, obj):
        return obj.repair.client.get_full_name() if obj.repair and obj.repair.client else ""
