"""PRO-KOM Serwis — Clients serializers."""
from .client import ClientSerializer, ClientListSerializer, ClientCreateUpdateSerializer
from .client_profile import ClientProfileSerializer
from .consent import ClientConsentSerializer
from .address import ClientAddressSerializer

__all__ = [
    "ClientSerializer",
    "ClientListSerializer",
    "ClientCreateUpdateSerializer",
    "ClientProfileSerializer",
    "ClientConsentSerializer",
    "ClientAddressSerializer",
]
