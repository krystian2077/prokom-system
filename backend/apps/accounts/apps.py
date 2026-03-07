"""
PRO-KOM Serwis — Accounts App — AppConfig
"""
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Konta użytkowników"
