"""Serializery logu komunikacji."""
from rest_framework import serializers
from apps.communications.models import CommunicationLog


class CommunicationLogSerializer(serializers.ModelSerializer):
    """Wpis w historii komunikacji (timeline naprawy)."""
    channel_display = serializers.CharField(source="get_channel_display", read_only=True)
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = CommunicationLog
        fields = [
            "id", "repair", "template", "template_name", "channel", "channel_display",
            "recipient", "subject", "body_snapshot", "sent_at", "sent_by", "status", "error_message",
        ]
        read_only_fields = fields
