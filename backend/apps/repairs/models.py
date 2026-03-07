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
    InternalRepairStatus,
    PaymentStatus,
)
from apps.common.utils import generate_repair_number


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
        """Generuj repair_number przy pierwszym zapisie."""
        if not self.repair_number:
            self.repair_number = generate_repair_number()
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

    class Meta:
        verbose_name = _("notatka naprawy")
        verbose_name_plural = _("notatki napraw")
        ordering = ["-created_at"]

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
