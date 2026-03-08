"""
PRO-KOM Serwis — Clients App — Models
======================================
Modele związane z klientami i ich danymi.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.common.models import BaseModel, SoftDeleteModel
from apps.common.enums import ContactPreference, ConsentType, ClientType, ClientSegment
from apps.common.validators import validate_polish_phone
from apps.common.utils import generate_client_number


class Client(BaseModel, SoftDeleteModel):
    """
    Model klienta serwisu.

    Jeden klient może mieć wiele urządzeń i napraw.
    Klient może być powiązany z User (jeśli ma konto w systemie).
    """
    # Powiązanie z kontem użytkownika (opcjonalne)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="client_profile",
        verbose_name=_("konto użytkownika"),
        help_text=_("Jeśli klient ma konto w systemie")
    )

    # Unikalny numer klienta
    client_number = models.CharField(
        _("numer klienta"),
        max_length=20,
        unique=True,
        editable=False,
        db_index=True
    )

    # Dane podstawowe
    first_name = models.CharField(_("imię"), max_length=100)
    last_name = models.CharField(_("nazwisko"), max_length=100)
    email = models.EmailField(_("e-mail"), db_index=True)
    phone = models.CharField(
        _("telefon"),
        max_length=20,
        validators=[validate_polish_phone],
        db_index=True
    )

    # Dane adresowe (opcjonalne, ale przydatne przy wysyłkach)
    street = models.CharField(_("ulica"), max_length=200, blank=True)
    city = models.CharField(_("miasto"), max_length=100, blank=True)
    postal_code = models.CharField(_("kod pocztowy"), max_length=10, blank=True)
    country = models.CharField(_("kraj"), max_length=100, default="Polska", blank=True)

    # Typ i segment (karta premium, segmentacja)
    client_type = models.CharField(
        _("typ klienta"),
        max_length=20,
        choices=ClientType.choices,
        default=ClientType.INDIVIDUAL,
        db_index=True,
    )
    client_segment = models.CharField(
        _("segment klienta"),
        max_length=20,
        choices=ClientSegment.choices,
        default=ClientSegment.NEW,
        blank=True,
        db_index=True,
    )
    visit_count = models.PositiveIntegerField(
        _("liczba wizyt"),
        default=0,
        help_text=_("Liczba przyjęć / napraw (do badge „klient wraca”)"),
    )
    last_visit_at = models.DateTimeField(
        _("ostatnia wizyta"),
        null=True,
        blank=True,
    )
    # Dane firmy (gdy client_type=business)
    company_name = models.CharField(
        _("nazwa firmy"),
        max_length=200,
        blank=True,
    )
    nip = models.CharField(
        _("NIP"),
        max_length=20,
        blank=True,
    )
    contact_person = models.CharField(
        _("osoba kontaktowa"),
        max_length=150,
        blank=True,
    )
    company_email = models.EmailField(
        _("e-mail firmowy"),
        blank=True,
    )
    company_phone = models.CharField(
        _("telefon firmowy"),
        max_length=20,
        blank=True,
    )

    # Preferencje komunikacji
    preferred_contact = models.CharField(
        _("preferowany sposób kontaktu"),
        max_length=20,
        choices=ContactPreference.choices,
        default=ContactPreference.EMAIL
    )

    # Marketing
    accepts_marketing = models.BooleanField(
        _("akceptuje komunikację marketingową"),
        default=False
    )

    # Notatki wewnętrzne
    internal_notes = models.TextField(
        _("notatki wewnętrzne"),
        blank=True,
        help_text=_("Notatki widoczne tylko dla staff")
    )

    # Statystyki (aktualizowane przez serwisy/sygnały)
    total_repairs = models.PositiveIntegerField(
        _("całkowita liczba napraw"),
        default=0
    )
    total_spent = models.DecimalField(
        _("całkowita kwota wydana"),
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Status klienta
    is_vip = models.BooleanField(
        _("klient VIP"),
        default=False,
        help_text=_("Klient priorytetowy")
    )
    is_blacklisted = models.BooleanField(
        _("na czarnej liście"),
        default=False,
        help_text=_("Klient problematyczny")
    )

    class Meta:
        verbose_name = _("klient")
        verbose_name_plural = _("klienci")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "phone"]),
            models.Index(fields=["client_number"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.client_number})"

    def get_full_name(self):
        """Zwraca pełne imię i nazwisko."""
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        """Generuj client_number przy pierwszym zapisie."""
        if not self.client_number:
            self.client_number = generate_client_number()
        super().save(*args, **kwargs)


class ClientConsent(BaseModel):
    """
    Zgody klienta (RODO, marketing, diagnoza, naprawa itp.).

    Każda zgoda jest osobnym rekordem z pełną historią.
    """
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="consents",
        verbose_name=_("klient")
    )
    terms_version = models.ForeignKey(
        "compliance.TermsVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consents",
        verbose_name=_("wersja dokumentu"),
        help_text=_("Opcjonalnie: wersja regulaminu przy tej zgodzie"),
    )
    consent_type = models.CharField(
        _("typ zgody"),
        max_length=30,
        choices=ConsentType.choices
    )

    is_granted = models.BooleanField(
        _("zgoda udzielona"),
        default=False
    )

    # Szczegóły zgody
    consent_text = models.TextField(
        _("treść zgody"),
        help_text=_("Dokładna treść zgody pokazana klientowi")
    )

    # Metadata
    granted_at = models.DateTimeField(
        _("data udzielenia"),
        null=True,
        blank=True
    )
    withdrawn_at = models.DateTimeField(
        _("data cofnięcia"),
        null=True,
        blank=True
    )

    # IP i user agent dla celów dowodowych
    ip_address = models.GenericIPAddressField(
        _("adres IP"),
        null=True,
        blank=True
    )
    user_agent = models.TextField(
        _("user agent"),
        blank=True
    )

    class Meta:
        verbose_name = _("zgoda klienta")
        verbose_name_plural = _("zgody klientów")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["client", "consent_type"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        status = "✓" if self.is_granted else "✗"
        return f"{status} {self.get_consent_type_display()} — {self.client.get_full_name()}"


class ClientNote(BaseModel):
    """
    Notatki dotyczące klienta.

    Tylko dla użytku wewnętrznego staff/admin.
    Klient nigdy nie widzi tych notatek.
    """
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="notes",
        verbose_name=_("klient")
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="client_notes",
        verbose_name=_("autor")
    )

    note = models.TextField(_("treść notatki"))

    is_important = models.BooleanField(
        _("ważna notatka"),
        default=False,
        help_text=_("Oznacz jako ważną aby wyróżnić")
    )

    class Meta:
        verbose_name = _("notatka o kliencie")
        verbose_name_plural = _("notatki o klientach")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notatka: {self.client.get_full_name()} od {self.author}"


class ClientAddress(BaseModel):
    """
    Adresy klienta (wysyłkowe, do faktury itp.).

    Klient może mieć wiele zapisanych adresów.
    """
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="addresses",
        verbose_name=_("klient")
    )

    label = models.CharField(
        _("etykieta"),
        max_length=50,
        help_text=_("np. 'Dom', 'Praca', 'Wysyłkowy'")
    )

    # Adres
    street = models.CharField(_("ulica i numer"), max_length=200)
    city = models.CharField(_("miasto"), max_length=100)
    postal_code = models.CharField(_("kod pocztowy"), max_length=10)
    country = models.CharField(_("kraj"), max_length=100, default="Polska")

    # Dodatkowe info
    phone = models.CharField(
        _("telefon kontaktowy"),
        max_length=20,
        blank=True,
        validators=[validate_polish_phone]
    )
    additional_info = models.TextField(
        _("dodatkowe informacje"),
        blank=True,
        help_text=_("np. kod bramy, piętro")
    )

    is_default = models.BooleanField(
        _("domyślny adres"),
        default=False
    )

    class Meta:
        verbose_name = _("adres klienta")
        verbose_name_plural = _("adresy klientów")
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.label}: {self.street}, {self.city}"

