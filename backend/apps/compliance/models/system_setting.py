"""Modele konfiguracji systemowej dla panelu admina."""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class SettingValueType(models.TextChoices):
    STRING = "string", _("Tekst")
    INTEGER = "integer", _("Liczba całkowita")
    FLOAT = "float", _("Liczba zmiennoprzecinkowa")
    BOOLEAN = "boolean", _("Tak/Nie")
    JSON = "json", _("JSON")


class SystemSetting(models.Model):
    """Konfigurowalna wartość systemowa (Control Center)."""

    key = models.CharField(_("klucz"), max_length=120, unique=True, db_index=True)
    category = models.CharField(_("kategoria"), max_length=50, db_index=True, default="general")
    label = models.CharField(_("etykieta"), max_length=120)
    description = models.TextField(_("opis"), blank=True)
    value_type = models.CharField(
        _("typ wartości"),
        max_length=20,
        choices=SettingValueType.choices,
        default=SettingValueType.STRING,
    )
    value_json = models.JSONField(_("wartość"), null=True, blank=True)
    is_secret = models.BooleanField(_("sekret"), default=False)
    is_readonly = models.BooleanField(_("tylko do odczytu"), default=False)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_system_settings",
        verbose_name=_("zaktualizowane przez"),
    )
    updated_at = models.DateTimeField(_("zaktualizowano"), auto_now=True)
    created_at = models.DateTimeField(_("utworzono"), auto_now_add=True)

    class Meta:
        verbose_name = _("ustawienie systemowe")
        verbose_name_plural = _("ustawienia systemowe")
        ordering = ["category", "key"]

    def __str__(self):
        return f"{self.key} ({self.get_value_type_display()})"


class FeatureFlag(models.Model):
    """Flaga funkcjonalności do kontrolowanego rolloutu."""

    key = models.CharField(_("klucz"), max_length=80, unique=True, db_index=True)
    name = models.CharField(_("nazwa"), max_length=120)
    description = models.TextField(_("opis"), blank=True)
    is_enabled = models.BooleanField(_("włączona"), default=False)
    rollout_percentage = models.PositiveSmallIntegerField(
        _("rollout %"),
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_("0-100; pozwala etapowo uruchamiać funkcję."),
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_feature_flags",
        verbose_name=_("zaktualizowane przez"),
    )
    updated_at = models.DateTimeField(_("zaktualizowano"), auto_now=True)
    created_at = models.DateTimeField(_("utworzono"), auto_now_add=True)

    class Meta:
        verbose_name = _("flaga funkcji")
        verbose_name_plural = _("flagi funkcji")
        ordering = ["key"]

    def __str__(self):
        return self.key


class ConfigAuditLog(models.Model):
    """Audyt zmian konfiguracji (kto, co, kiedy)."""

    ENTITY_SETTING = "setting"
    ENTITY_FEATURE_FLAG = "feature_flag"
    ENTITY_TYPES = [
        (ENTITY_SETTING, _("Ustawienie")),
        (ENTITY_FEATURE_FLAG, _("Feature flag")),
    ]

    entity_type = models.CharField(_("typ encji"), max_length=20, choices=ENTITY_TYPES, db_index=True)
    entity_key = models.CharField(_("klucz encji"), max_length=120, db_index=True)
    action = models.CharField(_("akcja"), max_length=30, default="updated")
    old_value = models.JSONField(_("stara wartość"), null=True, blank=True)
    new_value = models.JSONField(_("nowa wartość"), null=True, blank=True)
    metadata = models.JSONField(_("metadane"), default=dict, blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="config_audit_logs",
        verbose_name=_("zmienił"),
    )
    created_at = models.DateTimeField(_("utworzono"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("log audytu konfiguracji")
        verbose_name_plural = _("logi audytu konfiguracji")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_key", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.entity_type}:{self.entity_key} ({self.action})"

