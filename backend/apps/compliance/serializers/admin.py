"""Serializery do panelu admina compliance (RODO)."""

from rest_framework import serializers

from apps.compliance.models import BackupLog, ConfigAuditLog, FeatureFlag, GdprRequest, SystemSetting, TermsVersion


class TermsVersionAdminSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source="get_document_type_display", read_only=True)

    class Meta:
        model = TermsVersion
        fields = [
            "id",
            "code",
            "version",
            "document_type",
            "document_type_display",
            "is_active",
            "published_at",
            "created_at",
        ]
        read_only_fields = ["id", "code", "version", "published_at", "created_at"]


class GdprRequestAdminSerializer(serializers.ModelSerializer):
    request_type_display = serializers.CharField(source="get_request_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    client_full_name = serializers.CharField(source="client.get_full_name", read_only=True)
    client_email = serializers.CharField(source="client.email", read_only=True)

    handled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GdprRequest
        fields = [
            "id",
            "request_type",
            "request_type_display",
            "status",
            "status_display",
            "reason",
            "resolution_note",
            "requested_at",
            "resolved_at",
            "client_full_name",
            "client_email",
            "handled_by_name",
        ]
        read_only_fields = ["id", "requested_at", "resolved_at", "handled_by_name"]

    def get_handled_by_name(self, obj):
        u = getattr(obj, "handled_by", None)
        return u.get_full_name() if u else None


class GdprRequestAdminUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[c[0] for c in GdprRequest.STATUS])
    resolution_note = serializers.CharField(required=False, allow_blank=True)


class BackupLogAdminSerializer(serializers.ModelSerializer):
    backup_type_display = serializers.CharField(source="get_backup_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    triggered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BackupLog
        fields = [
            "id",
            "backup_type",
            "backup_type_display",
            "status",
            "status_display",
            "storage_path",
            "started_at",
            "finished_at",
            "error_message",
            "triggered_by_name",
        ]
        read_only_fields = fields

    def get_triggered_by_name(self, obj):
        u = getattr(obj, "triggered_by", None)
        return u.get_full_name() if u else None


class SystemSettingAdminSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    class Meta:
        model = SystemSetting
        fields = [
            "id",
            "key",
            "category",
            "label",
            "description",
            "value_type",
            "is_secret",
            "is_readonly",
            "value",
            "updated_at",
            "updated_by_name",
        ]
        read_only_fields = fields

    def get_updated_by_name(self, obj):
        u = getattr(obj, "updated_by", None)
        return u.get_full_name() if u else None

    def get_value(self, obj):
        # Sekretów nie zwracamy do UI; można je tylko nadpisać nową wartością.
        if obj.is_secret:
            return None
        return obj.value_json


class SystemSettingUpdateItemSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    value = serializers.JSONField()
    updated_at = serializers.DateTimeField(required=False)


class SystemSettingsBulkUpdateSerializer(serializers.Serializer):
    items = SystemSettingUpdateItemSerializer(many=True, allow_empty=False)


class FeatureFlagAdminSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FeatureFlag
        fields = [
            "id",
            "key",
            "name",
            "description",
            "is_enabled",
            "rollout_percentage",
            "updated_at",
            "updated_by_name",
        ]
        read_only_fields = fields

    def get_updated_by_name(self, obj):
        u = getattr(obj, "updated_by", None)
        return u.get_full_name() if u else None


class FeatureFlagUpdateItemSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=80)
    is_enabled = serializers.BooleanField()
    rollout_percentage = serializers.IntegerField(min_value=0, max_value=100)
    updated_at = serializers.DateTimeField(required=False)


class FeatureFlagsBulkUpdateSerializer(serializers.Serializer):
    items = FeatureFlagUpdateItemSerializer(many=True, allow_empty=False)


class ConfigAuditLogAdminSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ConfigAuditLog
        fields = [
            "id",
            "entity_type",
            "entity_key",
            "action",
            "old_value",
            "new_value",
            "metadata",
            "changed_by_name",
            "created_at",
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj):
        u = getattr(obj, "changed_by", None)
        return u.get_full_name() if u else None


