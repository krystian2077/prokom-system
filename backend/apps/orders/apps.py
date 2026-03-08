"""PRO-KOM Serwis — Orders App (Zamówienia klientów + Zaopatrzenie sklepu)."""
from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.orders"
    verbose_name = "Zamówienia i zaopatrzenie"
