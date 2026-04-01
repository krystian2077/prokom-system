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


class AdminStaffNotificationSerializer(StaffNotificationSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_role = serializers.CharField(source="user.role", read_only=True)

    class Meta(StaffNotificationSerializer.Meta):
        fields = [
            "user_id",
            "user_name",
            "user_email",
            "user_role",
            *StaffNotificationSerializer.Meta.fields,
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name()

