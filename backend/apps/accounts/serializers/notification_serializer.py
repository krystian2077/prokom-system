"""Serializery powiadomień staffu."""
from rest_framework import serializers
from apps.accounts.models import StaffNotification


class StaffNotificationSerializer(serializers.ModelSerializer):
    repair_number = serializers.CharField(source="repair.repair_number", read_only=True)
    repair_id = serializers.UUIDField(source="repair.id", read_only=True)

    class Meta:
        model = StaffNotification
        fields = [
            "id",
            "notification_type",
            "priority",
            "repair",
            "repair_id",
            "repair_number",
            "title",
            "description",
            "status",
            "link",
            "created_at",
        ]
        read_only_fields = fields
