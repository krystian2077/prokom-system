"""
PRO-KOM Serwis — Repairs App — Models
======================================
Modele związane z naprawami, zgłoszeniami i przypisaniami.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.accounts.models import UserRole
from apps.common.models import BaseModel, TimestampedModel
from apps.common.enums import (
    RepairStatus,
    RepairPriority,
    DeliveryMethod,
    ReturnMethod,
    RepairSource,
    RepairType,
    ComplaintWarrantyStatus,
    InternalRepairStatus,
    PaymentStatus,
)
from django.db import transaction
from django.utils import timezone


class RepairNumberSequence(models.Model):
    """
    Singleton (pk=1) przechowujący ostatni numer zgłoszenia.
    Używane do generowania numerów w formacie PROKOM/RMA/N/rok.
    """
    last_value = models.PositiveIntegerField(_("ostatni numer"), default=0)
    updated_at = models.DateTimeField(_("aktualizacja"), auto_now=True)

    class Meta:
        verbose_name = _("licznik numerów napraw")
        verbose_name_plural = _("liczniki numerów napraw")


def get_next_prokom_rma_number():
    """
    Zwraca kolejny numer zgłoszenia w formacie PROKOM/RMA/{N}/{rok}.
    N = które to zgłoszenie w całym systemie (licznik globalny).
    """
    with transaction.atomic():
        seq = RepairNumberSequence.objects.select_for_update().get(pk=1)
        seq.last_value += 1
        seq.save(update_fields=["last_value", "updated_at"])
        return f"PROKOM/RMA/{seq.last_value}/{timezone.now().year}"


class RepairRequest(BaseModel):
    """
    Główny model zgłoszenia naprawy.

    To jest centrum całego systemu - tutaj trzymamy wszystkie informacje
    o naprawie od momentu zgłoszenia do momentu odbioru.
    """
    # Unikalny numer naprawy
    repair_number = models.CharField(
        _("numer naprawy"),
        max_length=30,
        unique=True,
        editable=False,
        db_index=True
    )

    # Powiązania
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.PROTECT,
        related_name="repairs",
        verbose_name=_("klient")
    )

    device = models.ForeignKey(
        "devices.Device",
        on_delete=models.PROTECT,
        related_name="repairs",
        verbose_name=_("urządzenie")
    )

    # Reklamacja: powiązanie z naprawą, której dotyczy
    parent_repair = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaint_repairs",
        verbose_name=_("naprawa nadrzędna (reklamacja)"),
    )
    repair_type = models.CharField(
        _("typ sprawy"),
        max_length=20,
        choices=RepairType.choices,
        default=RepairType.STANDARD,
        db_index=True,
    )

    # Przypisanie do pracownika
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_repairs",
        verbose_name=_("przypisany do"),
        limit_choices_to={"role": UserRole.STAFF}
    )

    # Status i priorytet
    status = models.CharField(
        _("status"),
        max_length=30,
        choices=RepairStatus.choices,
        default=RepairStatus.NEW,
        db_index=True
    )

    priority = models.CharField(
        _("priorytet"),
        max_length=15,
        choices=RepairPriority.choices,
        default=RepairPriority.NORMAL,
        db_index=True
    )

    # Opis problemu
    problem_description = models.TextField(
        _("opis problemu"),
        help_text=_("Opis zgłoszony przez klienta")
    )

    # Szczegóły dostawy
    delivery_method = models.CharField(
        _("sposób dostarczenia"),
        max_length=20,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.IN_PERSON
    )

    return_method = models.CharField(
        _("sposób zwrotu"),
        max_length=20,
        choices=ReturnMethod.choices,
        default=ReturnMethod.IN_PERSON
    )

    # Adresy (jeśli wysyłka)
    delivery_address = models.ForeignKey(
        "clients.ClientAddress",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="delivery_repairs",
        verbose_name=_("adres dostawy")
    )

    return_address = models.ForeignKey(
        "clients.ClientAddress",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="return_repairs",
        verbose_name=_("adres zwrotu")
    )

    # Daty
    accepted_at = models.DateTimeField(
        _("data przyjęcia"),
        null=True,
        blank=True,
        help_text=_("Kiedy urządzenie zostało fizycznie przyjęte")
    )

    estimated_completion_date = models.DateField(
        _("szacowana data zakończenia"),
        null=True,
        blank=True
    )

    staff_planned_work_date = models.DateField(
        _("planowany dzień pracy (wewnętrzny)"),
        null=True,
        blank=True,
        help_text=_(
            "Kiedy pracownik planuje zająć się naprawą lub do niej wrócić; "
            "nie zastępuje terminu komunikowanego klientowi (estimated_completion_date)."
        ),
    )

    completed_at = models.DateTimeField(
        _("data zakończenia naprawy"),
        null=True,
        blank=True
    )

    ready_for_pickup_at = models.DateTimeField(
        _("data gotowości do odbioru"),
        null=True,
        blank=True
    )

    picked_up_at = models.DateTimeField(
        _("data odbioru przez klienta"),
        null=True,
        blank=True
    )

    # Flagi
    is_urgent = models.BooleanField(
        _("pilna naprawa"),
        default=False
    )

    is_same_day = models.BooleanField(
        _("Same Day Service"),
        default=False,
        help_text=_("Naprawa w ciągu jednego dnia roboczego")
    )

    is_warranty = models.BooleanField(
        _("naprawa gwarancyjna"),
        default=False
    )

    requires_data_backup = models.BooleanField(
        _("wymaga backupu danych"),
        default=False
    )

    data_backup_completed = models.BooleanField(
        _("backup danych wykonany"),
        default=False
    )

    # Wycena i koszty (podstawowe, szczegóły w app pricing)
    estimated_cost = models.DecimalField(
        _("szacowany koszt"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    final_cost = models.DecimalField(
        _("ostateczny koszt"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Status płatności (nieopłacone / zaliczka / opłacone)
    payment_status = models.CharField(
        _("status płatności"),
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )

    # Wewnętrzny status techniczny (tylko dla staff)
    internal_status = models.CharField(
        _("status wewnętrzny"),
        max_length=20,
        choices=InternalRepairStatus.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text=_("Techniczny status widoczny tylko dla pracowników")
    )

    # Szacowany czas realizacji (dni robocze) — do komunikacji z klientem
    estimated_duration_days_min = models.PositiveSmallIntegerField(
        _("szac. czas min (dni)"),
        null=True,
        blank=True,
        help_text=_("np. 2 dla przedziału 2–3 dni robocze")
    )
    estimated_duration_days_max = models.PositiveSmallIntegerField(
        _("szac. czas max (dni)"),
        null=True,
        blank=True,
        help_text=_("np. 3 dla przedziału 2–3 dni robocze")
    )

    # Notatki wewnętrzne
    internal_notes = models.TextField(
        _("notatki wewnętrzne"),
        blank=True,
        help_text=_("Widoczne tylko dla staff")
    )

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_repairs",
        verbose_name=_("utworzone przez")
    )

    source = models.CharField(
        _("źródło zgłoszenia"),
        max_length=20,
        choices=RepairSource.choices,
        default=RepairSource.ONLINE,
        db_index=True
    )

    # Z formularza publicznego: zainteresowanie folią Hammer Glass
    HAMMER_GLASS_YES = "yes"
    HAMMER_GLASS_NO = "no"
    HAMMER_GLASS_ASK_LATER = "ask_later"
    HAMMER_GLASS_FREE_WITH_QUOTE = "free_with_quote"
    HAMMER_GLASS_CHOICES = [
        (HAMMER_GLASS_YES, _("Tak, proszę o ofertę")),
        (HAMMER_GLASS_NO, _("Nie")),
        (HAMMER_GLASS_ASK_LATER, _("Zapytam później")),
        (HAMMER_GLASS_FREE_WITH_QUOTE, _("Gratis przy wycenie")),
    ]
    hammer_glass_interest = models.CharField(
        _("zainteresowanie Hammer Glass"),
        max_length=20,
        choices=HAMMER_GLASS_CHOICES,
        null=True,
        blank=True,
        db_index=True,
    )

    is_incomplete = models.BooleanField(
        _("niekompletne zgłoszenie"),
        default=False,
        help_text=_("Szybkie przyjęcie — do uzupełnienia później"),
    )

    # Z formularza publicznego: dodatkowe uwagi klienta, stan urządzenia
    client_notes = models.TextField(
        _("dodatkowe uwagi klienta"),
        blank=True,
        default="",
        help_text=_("Uwagi przekazane przez klienta przy zgłoszeniu (np. hasło, historia naprawy)."),
    )
    device_turns_on = models.BooleanField(
        _("czy urządzenie się włącza"),
        null=True,
        blank=True,
        help_text=_("Czy urządzenie włącza się przy zgłoszeniu (z formularza)."),
    )
    visual_condition_description = models.TextField(
        _("opis stanu wizualnego"),
        blank=True,
        default="",
        help_text=_("Rysy, pęknięcia, uszkodzenia obudowy — opis od klienta."),
    )
    client_tracking_number = models.CharField(
        _("numer listu przewozowego od klienta"),
        max_length=100,
        blank=True,
        default="",
        help_text=_("Opcjonalnie: numer przesyłki podany przez klienta (wysyłka kurierem do serwisu)."),
    )

    # Gościnne zgłoszenie: token do przypisania naprawy do konta (link z e-maila)
    claim_token = models.CharField(
        _("token przypisania"),
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text=_("Jednorazowy token do /claim-repair, ważny 7 dni. Tylko dla zgłoszeń gościnnych."),
    )
    claim_token_expires_at = models.DateTimeField(
        _("token ważny do"),
        null=True,
        blank=True,
        db_index=True,
    )

    # Flagi i daty do dashboardów / powiadomień (Staff Notifications Center, „wymaga reakcji”)
    requires_attention = models.BooleanField(
        _("wymaga reakcji"),
        default=False,
        db_index=True,
        help_text=_("Ustawiane przez logikę: nowa wiadomość, brak odpowiedzi, SLA, reklamacja bez decyzji itd."),
    )
    last_client_message_at = models.DateTimeField(
        _("ostatnia wiadomość od klienta"),
        null=True,
        blank=True,
    )
    last_staff_reply_at = models.DateTimeField(
        _("ostatnia odpowiedź staffu do klienta"),
        null=True,
        blank=True,
    )
    last_activity_at = models.DateTimeField(
        _("ostatnia aktywność"),
        null=True,
        blank=True,
        db_index=True,
        help_text=_("Ostatnia zmiana statusu, notatka lub wiadomość"),
    )

    # Czeka na klienta (np. wycena wysłana) — do licznika „czeka X dni”
    quote_sent_at = models.DateTimeField(
        _("data wysłania wyceny"),
        null=True,
        blank=True,
        help_text=_("Ustawiane przy zmianie statusu na wycena wysłana"),
    )

    # Status reklamacji/gwarancji (tylko gdy repair_type in (complaint, warranty))
    complaint_warranty_status = models.CharField(
        _("status reklamacji/gwarancji"),
        max_length=20,
        choices=ComplaintWarrantyStatus.choices,
        null=True,
        blank=True,
        db_index=True,
    )

    # Odbior paczki (wysyłka do serwisu) — ręczny proces MVP
    package_received_at = models.DateTimeField(_("odebrano paczkę"), null=True, blank=True)
    package_received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="package_received_repairs",
        verbose_name=_("paczkę odebrał"),
    )
    package_ok = models.BooleanField(_("paczka bez zastrzeżeń"), null=True, blank=True)
    request_number_attached = models.BooleanField(_("numer zgłoszenia dołączony do przesyłki"), null=True, blank=True)
    package_notes = models.TextField(_("notatki do odbioru paczki"), blank=True)
    package_photo = models.ImageField(
        _("zdjęcie paczki/urządzenia"),
        upload_to="repairs/package_photos/%Y/%m/",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("zgłoszenie naprawy")
        verbose_name_plural = _("zgłoszenia napraw")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["repair_number"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["assigned_to", "status"]),
            models.Index(fields=["client", "-created_at"]),
            models.Index(fields=["priority", "status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.repair_number} — {self.device.get_device_name()} — {self.get_status_display()}"

    def save(self, *args, **kwargs):
        """Generuj repair_number przy pierwszym zapisie (format PROKOM/RMA/N/rok)."""
        if not self.repair_number:
            self.repair_number = get_next_prokom_rma_number()
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Czy naprawa jest opóźniona?"""
        if not self.estimated_completion_date:
            return False

        from django.utils import timezone
        today = timezone.now().date()

        # Jeśli nie jest ukończona i termin minął
        if self.status not in [RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.CANCELLED]:
            return today > self.estimated_completion_date

        return False

    @property
    def days_in_repair(self):
        """Ile dni naprawa jest w serwisie?"""
        from django.utils import timezone

        if self.accepted_at:
            if self.picked_up_at:
                delta = self.picked_up_at - self.accepted_at
            else:
                delta = timezone.now() - self.accepted_at

            return delta.days

        return 0

    @property
    def can_be_picked_up(self):
        """Czy urządzenie może być odebrane?"""
        return self.status == RepairStatus.READY_FOR_PICKUP

    @property
    def is_waiting_for_client_decision(self):
        """Czy naprawa czeka na decyzję klienta?"""
        return self.status == RepairStatus.QUOTE_SENT

    @property
    def waiting_for_client_days(self):
        """Ile dni naprawa czeka na reakcję klienta (np. od wysłania wyceny). None jeśli nie dotyczy."""
        from django.utils import timezone
        if self.status != RepairStatus.QUOTE_SENT or not self.quote_sent_at:
            return None
        delta = timezone.now() - self.quote_sent_at
        return delta.days

    def get_auto_tags(self):
        """
        Tagi systemowe nadawane automatycznie na podstawie danych naprawy.
        Zwraca listę slugów do filtrowania i badge'y.
        """
        from apps.common.enums import RepairPriority
        tags = []
        if self.is_urgent or self.priority in (RepairPriority.HIGH, RepairPriority.URGENT, RepairPriority.SAME_DAY):
            tags.append("pilne")
        if self.is_same_day:
            tags.append("same_day")
        if self.delivery_method != "in_person" or self.return_method != "in_person":
            tags.append("wysyłkowe")
        if self.repair_type == "complaint":
            tags.append("reklamacja")
        if self.repair_type == "warranty":
            tags.append("gwarancja")
        if self.is_incomplete:
            tags.append("niekompletne")
        if self.status == RepairStatus.WAITING_FOR_PARTS:
            tags.append("czeka_na_czesc")
        try:
            if self.client and getattr(self.client, "visit_count", 0) >= 2:
                tags.append("klient_wraca")
            if self.client and getattr(self.client, "client_type", None) == "business":
                tags.append("firma")
        except Exception:
            pass
        try:
            brand_name = (self.device.brand.name if self.device and getattr(self.device, "brand", None) else None) or ""
            if "apple" in brand_name.lower():
                tags.append("apple")
            if "samsung" in brand_name.lower():
                tags.append("samsung")
        except Exception:
            pass
        try:
            if self.device and getattr(self.device, "category", None) == "data_recovery":
                tags.append("odzyskiwanie_danych")
        except Exception:
            pass
        # Hammer Glass / sprzedaż dodatkowa — z relacji (można rozszerzyć gdy modele są dostępne)
        try:
            if hasattr(self, "hammer_glass_offers") and self.hammer_glass_offers.exists():
                tags.append("hammer_glass")
            if hasattr(self, "accessory_offers") and self.accessory_offers.exists():
                tags.append("sprzedaz_dodatkowa")
        except Exception:
            pass
        return tags

    def get_estimated_duration_display(self):
        """Tekst szacowanego czasu realizacji, np. '2–3 dni robocze' (do komunikatów)."""
        min_d, max_d = self.estimated_duration_days_min, self.estimated_duration_days_max
        if min_d is not None and max_d is not None:
            if min_d == max_d:
                return f"{min_d} dni robocze"
            return f"{min_d}–{max_d} dni robocze"
        if min_d is not None:
            return f"od {min_d} dni robocze"
        if max_d is not None:
            return f"do {max_d} dni robocze"
        return ""


class RepairClaimSmsCode(models.Model):
    """
    Jednorazowy kod SMS do przypisania naprawy gościnnej w panelu (numer ref + ostatnie 4 cyfry).
    Ważny ok. 10 minut.
    """
    repair = models.OneToOneField(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="claim_sms_code",
        verbose_name=_("naprawa"),
    )
    code = models.CharField(_("kod"), max_length=6, db_index=True)
    expires_at = models.DateTimeField(_("ważny do"), db_index=True)

    class Meta:
        verbose_name = _("kod SMS przypisania naprawy")
        verbose_name_plural = _("kody SMS przypisania naprawy")

    def __str__(self):
        return f"{self.repair.repair_number} — ***"


class RepairStatusHistory(TimestampedModel):
    """
    Historia zmian statusów naprawy.

    Każda zmiana statusu jest zapisywana jako osobny rekord.
    To pozwala na pełne śledzenie timeline naprawy.
    """
    repair = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="status_history",
        verbose_name=_("naprawa")
    )

    old_status = models.CharField(
        _("poprzedni status"),
        max_length=30,
        choices=RepairStatus.choices,
        null=True,
        blank=True
    )

    new_status = models.CharField(
        _("nowy status"),
        max_length=30,
        choices=RepairStatus.choices
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="status_changes",
        verbose_name=_("zmienione przez")
    )

    notes = models.TextField(
        _("notatki"),
        blank=True,
        help_text=_("Opcjonalny komentarz do zmiany statusu")
    )

    class Meta:
        verbose_name = _("historia statusu")
        verbose_name_plural = _("historia statusów")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.repair.repair_number}: {self.old_status} → {self.new_status}"


class RepairAssignment(TimestampedModel):
    """
    Historia przypisań naprawy do pracowników.

    Naprawa może być przekazywana między pracownikami.
    Ten model śledzi pełną historię przypisań.
    """
    repair = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="assignments",
        verbose_name=_("naprawa")
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="repair_assignments",
        verbose_name=_("przypisany do")
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="made_assignments",
        verbose_name=_("przypisane przez")
    )

    assigned_at = models.DateTimeField(
        _("data przypisania"),
        auto_now_add=True
    )

    unassigned_at = models.DateTimeField(
        _("data odpisania"),
        null=True,
        blank=True
    )

    is_current = models.BooleanField(
        _("aktualne przypisanie"),
        default=True,
        db_index=True
    )

    notes = models.TextField(
        _("notatki"),
        blank=True,
        help_text=_("Powód przypisania/przekazania")
    )

    class Meta:
        verbose_name = _("przypisanie naprawy")
        verbose_name_plural = _("przypisania napraw")
        ordering = ["-assigned_at"]
        indexes = [
            models.Index(fields=["repair", "-assigned_at"]),
            models.Index(fields=["assigned_to", "is_current"]),
        ]

    def __str__(self):
        status = "✓" if self.is_current else "✗"
        return f"{status} {self.repair.repair_number} → {self.assigned_to.get_full_name()}"


class RepairImage(TimestampedModel):
    """
    Zdjęcia związane z naprawą.

    Mogą to być:
    - zdjęcia przed naprawą (uszkodzenia)
    - zdjęcia w trakcie (diagnostyka, postęp prac)
    - zdjęcia po naprawie (efekt końcowy)
    """
    repair = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name=_("naprawa")
    )

    image = models.FileField(
        _("zdjęcie"),
        upload_to="repairs/photos/%Y/%m/"
    )

    caption = models.CharField(
        _("opis"),
        max_length=200,
        blank=True
    )

    image_type = models.CharField(
        _("typ zdjęcia"),
        max_length=20,
        choices=[
            ("before", _("Przed naprawą")),
            ("during", _("W trakcie")),
            ("after", _("Po naprawie")),
            ("package", _("Paczka po odbiorze")),
            ("damage_detail", _("Uszkodzenie szczegółowe")),
            ("issue", _("Uszkodzenie/Problem")),
            ("other", _("Inne")),
        ],
        default="before"
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="repair_images",
        verbose_name=_("dodane przez")
    )

    is_visible_to_client = models.BooleanField(
        _("widoczne dla klienta"),
        default=True,
        help_text=_("Czy klient widzi to zdjęcie w panelu")
    )

    class Meta:
        verbose_name = _("zdjęcie naprawy")
        verbose_name_plural = _("zdjęcia napraw")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Zdjęcie: {self.repair.repair_number} — {self.caption}"


class RepairNoteThreadOrigin(models.TextChoices):
    """Pochodzenie wpisu w widocznym dla klienta wątku wiadomości."""
    CLIENT = "client", _("Klient (panel)")
    STAFF = "staff", _("Pracownik (panel)")
    SYSTEM = "system", _("System")
    EMAIL_INBOUND = "email_inbound", _("E-mail przychodzący")


class RepairNote(TimestampedModel):
    """
    Notatki dotyczące naprawy.

    Mogą być wewnętrzne (tylko dla staff) lub publiczne (widoczne dla klienta).
    """
    repair = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="notes",
        verbose_name=_("naprawa")
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="repair_notes",
        verbose_name=_("autor")
    )

    note = models.TextField(_("treść notatki"))

    is_internal = models.BooleanField(
        _("notatka wewnętrzna"),
        default=True,
        help_text=_("Notatki wewnętrzne nie są widoczne dla klienta")
    )

    is_important = models.BooleanField(
        _("ważna notatka"),
        default=False
    )

    NOTE_TYPE_INTERNAL = "internal"
    NOTE_TYPE_SYSTEM = "system"
    NOTE_TYPE_CLIENT_CONTACT = "client_contact"
    NOTE_TYPE_CHOICES = [
        (NOTE_TYPE_INTERNAL, _("wewnętrzna")),
        (NOTE_TYPE_SYSTEM, _("systemowa")),
        (NOTE_TYPE_CLIENT_CONTACT, _("kontakt z klientem")),
    ]
    note_type = models.CharField(
        _("typ notatki"),
        max_length=20,
        choices=NOTE_TYPE_CHOICES,
        default=NOTE_TYPE_INTERNAL,
        db_index=True,
    )
    pinned = models.BooleanField(
        _("przypięta"),
        default=False,
        help_text=_("Przypięte notatki wyświetlane na górze"),
    )
    thread_origin = models.CharField(
        _("pochodzenie w wątku"),
        max_length=20,
        choices=RepairNoteThreadOrigin.choices,
        default=RepairNoteThreadOrigin.STAFF,
        db_index=True,
        help_text=_("Dla widocznych dla klienta wpisów: kto/nad czym — wątek wiadomości."),
    )

    class Meta:
        verbose_name = _("notatka naprawy")
        verbose_name_plural = _("notatki napraw")
        ordering = ["-pinned", "-created_at"]
        indexes = [
            models.Index(fields=["repair", "thread_origin"]),
        ]

    def __str__(self):
        note_type = "🔒 Wewnętrzna" if self.is_internal else "👁️ Publiczna"
        return f"{note_type}: {self.repair.repair_number}"


class SatisfactionSurvey(models.Model):
    """Ankieta satysfakcji po naprawie (rating, polecenie, komentarz)."""
    repair = models.OneToOneField(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="satisfaction_survey",
        verbose_name=_("naprawa"),
    )
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="satisfaction_surveys",
        verbose_name=_("klient"),
    )
    rating = models.PositiveSmallIntegerField(
        _("ocena"),
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text=_("1–5 gwiazdek"),
    )
    would_recommend = models.BooleanField(_("poleciłby serwis"), default=True)
    comment = models.TextField(_("komentarz"), blank=True)
    submitted_at = models.DateTimeField(_("data wypełnienia"), auto_now_add=True)

    class Meta:
        verbose_name = _("ankieta satysfakcji")
        verbose_name_plural = _("ankiety satysfakcji")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Ankieta: {self.repair.repair_number} — {self.rating}/5"


class RepairVisitSchedule(models.Model):
    """Planowana wizyta / odbiór (data, godzina, ewentualnie no_show)."""
    repair = models.OneToOneField(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="visit_schedule",
        verbose_name=_("naprawa"),
    )
    visit_date = models.DateField(_("data wizyty"), null=True, blank=True)
    visit_time = models.TimeField(_("godzina wizyty"), null=True, blank=True)
    estimated_duration_minutes = models.PositiveSmallIntegerField(
        _("szac. czas [min]"),
        null=True,
        blank=True,
    )
    estimated_pickup_time = models.TimeField(
        _("szac. godzina odbioru"),
        null=True,
        blank=True,
    )
    no_show = models.BooleanField(_("klient nie stawił się"), default=False)
    confirmed_at = models.DateTimeField(_("potwierdzono"), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("harmonogram wizyty")
        verbose_name_plural = _("harmonogramy wizyt")

    def __str__(self):
        return f"Wizyta: {self.repair.repair_number} — {self.visit_date}"


class ReminderLog(models.Model):
    """
    Log wysłanego przypomnienia — ogranicza spam (np. raz na 24h per typ).
    """
    repair = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="reminder_logs",
        verbose_name=_("naprawa"),
    )
    event_name = models.CharField(
        _("zdarzenie"),
        max_length=50,
        db_index=True,
        help_text=_("np. reminder_no_quote, reminder_unclaimed, reminder_scheduled_visit, reminder_quick_accept_incomplete"),
    )
    sent_at = models.DateTimeField(_("wysłano"), auto_now_add=True)

    class Meta:
        verbose_name = _("log przypomnienia")
        verbose_name_plural = _("logi przypomnień")
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["repair", "event_name", "-sent_at"]),
        ]

    def __str__(self):
        return f"{self.event_name} — {self.repair.repair_number} @ {self.sent_at}"


class ChecklistTemplate(models.Model):
    """Szablon checklisty (np. przyjęcie telefonu, przyjęcie laptopa)."""
    name = models.CharField(_("nazwa"), max_length=150)
    device_category_code = models.CharField(
        _("kategoria urządzenia"),
        max_length=30,
        blank=True,
        db_index=True,
        help_text=_("Opcjonalnie: phone, tablet, laptop, ..."),
    )
    is_active = models.BooleanField(_("aktywny"), default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("szablon checklisty")
        verbose_name_plural = _("szablony checklist")

    def __str__(self):
        return self.name


class ChecklistTemplateItem(models.Model):
    """Pozycja w szablonie checklisty."""
    template = models.ForeignKey(
        ChecklistTemplate,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("szablon"),
    )
    label = models.CharField(_("etykieta"), max_length=200)
    item_type = models.CharField(
        _("typ"),
        max_length=20,
        choices=[
            ("checkbox", _("Checkbox")),
            ("text", _("Tekst")),
            ("select", _("Wybierz")),
        ],
        default="checkbox",
    )
    sort_order = models.PositiveSmallIntegerField(_("kolejność"), default=0)

    class Meta:
        verbose_name = _("pozycja szablonu")
        verbose_name_plural = _("pozycje szablonu")
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.template.name}: {self.label}"


class ChecklistRun(models.Model):
    """Uruchomienie checklisty przy naprawie."""
    repair = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="checklist_runs",
        verbose_name=_("naprawa"),
    )
    template = models.ForeignKey(
        ChecklistTemplate,
        on_delete=models.PROTECT,
        related_name="runs",
        verbose_name=_("szablon"),
    )
    started_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="checklist_runs_started",
        verbose_name=_("rozpoczął"),
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=[
            ("in_progress", _("W toku")),
            ("completed", _("Zakończono")),
        ],
        default="in_progress",
    )
    started_at = models.DateTimeField(_("rozpoczęto"), auto_now_add=True)
    completed_at = models.DateTimeField(_("zakończono"), null=True, blank=True)

    class Meta:
        verbose_name = _("uruchomienie checklisty")
        verbose_name_plural = _("uruchomienia checklist")

    def __str__(self):
        return f"{self.repair.repair_number} — {self.template.name}"


class ChecklistRunItem(models.Model):
    """Wynik pozycji checklisty (odhaczone / wpis)."""
    run = models.ForeignKey(
        ChecklistRun,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("uruchomienie"),
    )
    template_item = models.ForeignKey(
        ChecklistTemplateItem,
        on_delete=models.CASCADE,
        related_name="run_items",
        verbose_name=_("pozycja szablonu"),
    )
    result = models.CharField(_("wynik"), max_length=50, blank=True)
    note = models.TextField(_("notatka"), blank=True)
    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="checklist_run_items_checked",
        verbose_name=_("sprawdził"),
    )
    checked_at = models.DateTimeField(_("data sprawdzenia"), null=True, blank=True)

    class Meta:
        verbose_name = _("pozycja checklisty (wynik)")
        verbose_name_plural = _("pozycje checklisty (wyniki)")
        unique_together = [["run", "template_item"]]

    def __str__(self):
        return f"{self.run} — {self.template_item.label}"


class TeamThreadMessage(models.Model):
    """Wiadomość w wątku zespołowym przy naprawie (tylko staff/admin)."""
    repair = models.ForeignKey(
        RepairRequest,
        on_delete=models.CASCADE,
        related_name="team_thread_messages",
        verbose_name=_("naprawa"),
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="team_thread_messages",
        verbose_name=_("autor"),
    )
    mentioned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="team_thread_mentions",
        verbose_name=_("wspomniany użytkownik"),
    )
    body = models.TextField(_("treść"))
    created_at = models.DateTimeField(_("data"), auto_now_add=True)

    class Meta:
        verbose_name = _("wiadomość wątku zespołowego")
        verbose_name_plural = _("wiadomości wątku zespołowego")
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.repair.repair_number} — {self.author} @ {self.created_at}"
