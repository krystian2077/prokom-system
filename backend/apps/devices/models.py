"""
PRO-KOM Serwis — Devices App — Models
======================================
Modele związane z urządzeniami, markami i modelami.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel, TimestampedModel
from apps.common.enums import DeviceCategory
from apps.common.validators import validate_imei, validate_serial_number


class Brand(TimestampedModel):
    """
    Marka urządzenia (Apple, Samsung, Lenovo itp.).
    """
    name = models.CharField(
        _("nazwa marki"),
        max_length=100,
        unique=True,
        db_index=True
    )

    slug = models.SlugField(
        _("slug"),
        max_length=100,
        unique=True
    )

    logo = models.FileField(
        _("logo"),
        upload_to="brands/logos/",
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        _("aktywna"),
        default=True,
        help_text=_("Czy marka jest aktualnie obsługiwana")
    )

    # SEO i marketing
    description = models.TextField(
        _("opis"),
        blank=True,
        help_text=_("Opis marki dla celów marketingowych")
    )

    class Meta:
        verbose_name = _("marka")
        verbose_name_plural = _("marki")
        ordering = ["name"]

    def __str__(self):
        return self.name


class DeviceModel(TimestampedModel):
    """
    Model urządzenia (iPhone 13, Galaxy S21, ThinkPad X1 itp.).

    Każdy model należy do marki i kategorii.
    """
    brand = models.ForeignKey(
        Brand,
        on_delete=models.CASCADE,
        related_name="models",
        verbose_name=_("marka")
    )

    category = models.CharField(
        _("kategoria"),
        max_length=20,
        choices=DeviceCategory.choices
    )

    name = models.CharField(
        _("nazwa modelu"),
        max_length=200,
        db_index=True
    )

    slug = models.SlugField(
        _("slug"),
        max_length=200,
        unique=True
    )

    # Szczegóły techniczne
    full_name = models.CharField(
        _("pełna nazwa"),
        max_length=300,
        blank=True,
        help_text=_("np. 'Apple iPhone 13 Pro Max 256GB Sierra Blue'")
    )

    release_year = models.PositiveIntegerField(
        _("rok wydania"),
        null=True,
        blank=True
    )

    # Specyfikacja (opcjonalna, JSONField byłby idealny)
    processor = models.CharField(_("procesor"), max_length=200, blank=True)
    ram = models.CharField(_("RAM"), max_length=50, blank=True)
    storage_options = models.CharField(
        _("opcje pamięci"),
        max_length=200,
        blank=True,
        help_text=_("np. '64GB, 128GB, 256GB'")
    )

    # Obrazy
    image = models.FileField(
        _("zdjęcie"),
        upload_to="devices/models/",
        null=True,
        blank=True
    )

    # Status
    is_active = models.BooleanField(
        _("aktywny"),
        default=True,
        help_text=_("Czy model jest aktualnie serwisowany")
    )

    # Popularność (do sortowania)
    popularity_score = models.PositiveIntegerField(
        _("wskaźnik popularności"),
        default=0,
        help_text=_("Aktualizowany na podstawie liczby napraw")
    )

    # SEO
    description = models.TextField(
        _("opis"),
        blank=True
    )

    class Meta:
        verbose_name = _("model urządzenia")
        verbose_name_plural = _("modele urządzeń")
        ordering = ["brand__name", "name"]
        unique_together = [["brand", "name"]]
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["-popularity_score"]),
        ]

    def __str__(self):
        return f"{self.brand.name} {self.name}"

    def get_full_name(self):
        """Zwraca pełną nazwę urządzenia."""
        return self.full_name or f"{self.brand.name} {self.name}"


class Device(BaseModel):
    """
    Konkretne urządzenie klienta.

    Jeden klient może mieć wiele urządzeń.
    Jedno urządzenie może mieć wiele napraw.
    """
    # Powiązanie z klientem
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="devices",
        verbose_name=_("klient")
    )

    # Typ i model urządzenia
    category = models.CharField(
        _("kategoria"),
        max_length=20,
        choices=DeviceCategory.choices
    )

    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="devices",
        verbose_name=_("marka"),
        null=True,
        blank=True
    )

    device_model = models.ForeignKey(
        DeviceModel,
        on_delete=models.PROTECT,
        related_name="devices",
        verbose_name=_("model"),
        null=True,
        blank=True,
        help_text=_("Wybierz z listy lub zostaw puste jeśli nie ma w bazie")
    )

    # Ręczne pole model (jeśli nie ma w bazie)
    model_name = models.CharField(
        _("nazwa modelu (ręcznie)"),
        max_length=200,
        blank=True,
        help_text=_("Jeśli model nie jest w bazie")
    )

    # „Inne urządzenie” (kategoria other) — pola ręczne przy przyjęciu stacjonarnym
    manual_device_name = models.CharField(
        _("nazwa urządzenia (inne)"),
        max_length=200,
        blank=True,
        help_text=_("Dla kategorii „inne urządzenie”"),
    )
    manual_brand = models.CharField(
        _("marka (ręcznie)"),
        max_length=100,
        blank=True,
    )
    manual_model = models.CharField(
        _("model (ręcznie)"),
        max_length=150,
        blank=True,
    )

    # Identyfikatory urządzenia
    serial_number = models.CharField(
        _("numer seryjny"),
        max_length=100,
        blank=True,
        validators=[validate_serial_number]
    )

    imei = models.CharField(
        _("IMEI"),
        max_length=20,
        blank=True,
        validators=[validate_imei],
        help_text=_("Dotyczy telefonów i tabletów z LTE")
    )

    # Stan urządzenia
    condition_on_arrival = models.TextField(
        _("stan przy przyjęciu"),
        blank=True,
        help_text=_("Opis stanu wizualnego, uszkodzeń mechanicznych itp.")
    )

    has_screen_protector = models.BooleanField(
        _("posiada folię ochronną"),
        default=False
    )

    has_case = models.BooleanField(
        _("posiada etui/case"),
        default=False
    )

    # Akcesoria dołączone
    accessories_included = models.TextField(
        _("dołączone akcesoria"),
        blank=True,
        help_text=_("np. 'ładowarka, kabel USB-C, słuchawki'")
    )

    # Hasło/PIN/kod
    password = models.CharField(
        _("hasło/PIN/kod"),
        max_length=100,
        blank=True,
        help_text=_("Hasło dostępu do urządzenia (jeśli podane)")
    )

    # Notatki
    notes = models.TextField(
        _("notatki"),
        blank=True,
        help_text=_("Dodatkowe informacje o urządzeniu")
    )

    class Meta:
        verbose_name = _("urządzenie")
        verbose_name_plural = _("urządzenia")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["client", "-created_at"]),
            models.Index(fields=["category"]),
            models.Index(fields=["serial_number"]),
            models.Index(fields=["imei"]),
        ]

    def __str__(self):
        device_name = self.get_device_name()
        return f"{device_name} — {self.client.get_full_name()}"

    def get_device_name(self):
        """Zwraca nazwę urządzenia."""
        if self.manual_device_name:
            return self.manual_device_name
        if self.device_model:
            return str(self.device_model)
        if self.manual_brand and self.manual_model:
            return f"{self.manual_brand} {self.manual_model}"
        if self.brand and self.model_name:
            return f"{self.brand.name} {self.model_name}"
        if self.model_name:
            return self.model_name
        if self.manual_brand:
            return self.manual_brand
        return f"{self.get_category_display()}"

    def get_brand_name(self):
        """Zwraca nazwę marki."""
        if self.brand:
            return self.brand.name
        return "Inna marka"


class DeviceImage(TimestampedModel):
    """
    Zdjęcia urządzenia (przy przyjęciu, po naprawie, uszkodzenia itp.).
    """
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name=_("urządzenie")
    )

    image = models.FileField(
        _("zdjęcie"),
        upload_to="devices/photos/%Y/%m/"
    )

    caption = models.CharField(
        _("opis"),
        max_length=200,
        blank=True,
        help_text=_("np. 'uszkodzony ekran', 'zarysowania na tylnej klapce'")
    )

    is_before = models.BooleanField(
        _("zdjęcie przed naprawą"),
        default=True
    )

    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="device_images",
        verbose_name=_("dodane przez")
    )

    class Meta:
        verbose_name = _("zdjęcie urządzenia")
        verbose_name_plural = _("zdjęcia urządzeń")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Zdjęcie: {self.device.get_device_name()} — {self.caption}"

