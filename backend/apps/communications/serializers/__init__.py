"""PRO-KOM Serwis — Communications serializers."""
from .template import MessageTemplateSerializer, MessageTemplateListSerializer
from .log import CommunicationLogSerializer

__all__ = [
    "MessageTemplateSerializer",
    "MessageTemplateListSerializer",
    "CommunicationLogSerializer",
]
