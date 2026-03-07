"""Serializery szablonów wiadomości."""
from rest_framework import serializers
from apps.communications.models import MessageTemplate


class MessageTemplateListSerializer(serializers.ModelSerializer):
    """Lista szablonów (do wyboru przy wysyłce)."""
    channel_display = serializers.CharField(source="get_channel_display", read_only=True)
    message_type_display = serializers.CharField(source="get_message_type_display", read_only=True)

    class Meta:
        model = MessageTemplate
        fields = [
            "id", "name", "channel", "channel_display", "message_type", "message_type_display",
            "subject", "suggested_for_status", "is_active", "sort_order",
        ]


class MessageTemplateSerializer(serializers.ModelSerializer):
    """Pełny szablon z treścią (do podglądu i edycji)."""
    channel_display = serializers.CharField(source="get_channel_display", read_only=True)
    message_type_display = serializers.CharField(source="get_message_type_display", read_only=True)

    class Meta:
        model = MessageTemplate
        fields = [
            "id", "name", "channel", "channel_display", "message_type", "message_type_display",
            "subject", "body", "is_active", "sort_order", "suggested_for_status",
        ]
