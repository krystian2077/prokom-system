"""Statusy i flagi modułu zamówień."""
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomerOrderStatus(models.TextChoices):
    """Statusy zamówienia klienta."""
    NEW = "new", _("Nowe")
    TO_ORDER = "to_order", _("Do zamówienia")
    ORDERED = "ordered", _("Zamówione")
    IN_TRANSIT = "in_transit", _("W drodze")
    ARRIVED = "arrived", _("Dotarło")
    CLIENT_NOTIFIED = "client_notified", _("Klient poinformowany")
    READY_FOR_PICKUP = "ready_for_pickup", _("Gotowe do odbioru")
    PICKED_UP = "picked_up", _("Odebrane")
    CANCELLED = "cancelled", _("Anulowane")


class StoreSupplyStatus(models.TextChoices):
    """Statusy zaopatrzenia sklepu."""
    TO_ORDER = "to_order", _("Do zamówienia")
    ORDERED = "ordered", _("Zamówione")
    IN_TRANSIT = "in_transit", _("W drodze")
    ARRIVED = "arrived", _("Dotarło")
    RESTOCKED = "restocked", _("Uzupełniono na sklepie")
    CANCELLED = "cancelled", _("Anulowane")


class SupplyPriority(models.TextChoices):
    """Priorytet zaopatrzenia."""
    LOW = "low", _("Niski")
    STANDARD = "standard", _("Standardowy")
    HIGH = "high", _("Wysoki")
    URGENT = "urgent", _("Pilne")
