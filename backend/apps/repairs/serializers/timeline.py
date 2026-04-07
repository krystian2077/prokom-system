"""Serializery timeline naprawy i wiadomości (zdarzenia: zmiana statusu, notatka, komunikacja)."""
from rest_framework import serializers
from apps.repairs.models import RepairStatusHistory, RepairNote
from apps.communications.models import CommunicationLog


class RepairMessageSerializer(serializers.ModelSerializer):
    """Wiadomość do klienta (publiczna notatka) — lista w panelu klienta."""
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = RepairNote
        fields = ["id", "note", "is_important", "author_name", "thread_origin", "created_at"]

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None


class TimelineStatusChangeSerializer(serializers.ModelSerializer):
    """Zdarzenie: zmiana statusu."""
    type = serializers.SerializerMethodField()
    changed_by_name = serializers.SerializerMethodField()
    old_status_display = serializers.SerializerMethodField()
    new_status_display = serializers.SerializerMethodField()

    class Meta:
        model = RepairStatusHistory
        fields = [
            "type",
            "id",
            "old_status",
            "new_status",
            "old_status_display",
            "new_status_display",
            "notes",
            "changed_by",
            "changed_by_name",
            "created_at",
        ]

    def get_type(self, obj):
        return "status_change"

    def get_changed_by_name(self, obj):
        return obj.changed_by.get_full_name() if obj.changed_by else None

    def get_old_status_display(self, obj):
        return obj.get_old_status_display() if obj.old_status else None

    def get_new_status_display(self, obj):
        return obj.get_new_status_display()


class TimelineStatusChangeClientSerializer(TimelineStatusChangeSerializer):
    """Zdarzenie: zmiana statusu dla klienta (bez notatek wewnętrznych)."""

    class Meta(TimelineStatusChangeSerializer.Meta):
        fields = [
            "type",
            "id",
            "old_status",
            "new_status",
            "old_status_display",
            "new_status_display",
            "changed_by",
            "changed_by_name",
            "created_at",
        ]


class TimelineNoteSerializer(serializers.ModelSerializer):
    """Zdarzenie: notatka (wewnętrzna lub publiczna)."""
    type = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = RepairNote
        fields = [
            "type",
            "id",
            "note",
            "is_internal",
            "is_important",
            "author",
            "author_name",
            "created_at",
        ]

    def get_type(self, obj):
        return "note"

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None


class TimelineCommunicationSerializer(serializers.ModelSerializer):
    """Zdarzenie: wysłana wiadomość (e-mail/SMS) — w timeline naprawy."""
    type = serializers.SerializerMethodField()
    channel_display = serializers.CharField(source="get_channel_display", read_only=True)
    body_preview = serializers.SerializerMethodField()
    sent_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CommunicationLog
        fields = [
            "type", "id", "channel", "channel_display", "recipient", "subject",
            "body_preview", "body_snapshot", "sent_at", "sent_by", "sent_by_name", "status",
        ]

    def get_type(self, obj):
        return "communication"

    def get_body_preview(self, obj):
        text = obj.body_snapshot or ""
        return text[:100] + ("..." if len(text) > 100 else "")

    def get_sent_by_name(self, obj):
        return obj.sent_by.get_full_name() if obj.sent_by else None
