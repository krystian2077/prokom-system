"""
PRO-KOM Serwis — Accounts App — Models
========================================
Custom User Model z rolami: admin, staff, client.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserRole(models.TextChoices):
    """Role użytkowników w systemie."""
    ADMIN = "admin", _("Administrator")
    STAFF = "staff", _("Pracownik serwisu")
    CLIENT = "client", _("Klient")


class UserManager(BaseUserManager):
    """Menedżer custom User model."""

    def create_user(self, email, password=None, **extra_fields):
        """Tworzy zwykłego użytkownika."""
        if not email:
            raise ValueError(_("Email jest wymagany"))
        email = self.normalize_email(email)
        extra_fields.setdefault("role", UserRole.CLIENT)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_staffuser(self, email, password=None, **extra_fields):
        """Tworzy pracownika serwisu."""
        extra_fields["role"] = UserRole.STAFF
        extra_fields.setdefault("is_staff", True)
        return self.create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Tworzy administratora / superusera."""
        extra_fields["role"] = UserRole.ADMIN
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser musi mieć is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser musi mieć is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User Model dla PRO-KOM Serwis.

    Logowanie przez email (nie username).
    Trzy role: admin, staff, client.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("email"), unique=True)
    first_name = models.CharField(_("imię"), max_length=150, blank=True)
    last_name = models.CharField(_("nazwisko"), max_length=150, blank=True)
    phone = models.CharField(_("telefon"), max_length=20, blank=True)

    # Rola w systemie
    role = models.CharField(
        _("rola"),
        max_length=10,
        choices=UserRole.choices,
        default=UserRole.CLIENT,
    )

    # Status konta
    is_active = models.BooleanField(_("aktywny"), default=True)
    is_staff = models.BooleanField(_("dostęp do panelu admina"), default=False)
    email_verified = models.BooleanField(
        _("e-mail zweryfikowany"),
        default=False,
        help_text=_("Klient: po weryfikacji kodem OTP z e-maila"),
    )
    verification_blocked_until = models.DateTimeField(
        _("weryfikacja zablokowana do"),
        null=True,
        blank=True,
        db_index=True,
        help_text=_("Po 5 błędnych kodach OTP — blokada 15 min."),
    )
    # Superadmin: konto nie może być usunięte ani trwale zablokowane (odzyskiwanie systemu)
    is_superadmin = models.BooleanField(
        _("superadministrator"),
        default=False,
        help_text=_("Konto nie może być usunięte; służy do odzyskania systemu"),
    )
    must_change_password = models.BooleanField(
        _("wymuś zmianę hasła przy pierwszym logowaniu"),
        default=False,
        help_text=_("Po zalogowaniu użytkownik zostanie przekierowany do zmiany hasła"),
    )

    # Daty
    date_joined = models.DateTimeField(_("data rejestracji"), default=timezone.now)
    last_login = models.DateTimeField(_("ostatnie logowanie"), null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = _("użytkownik")
        verbose_name_plural = _("użytkownicy")
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    def get_full_name(self):
        """Zwraca pełne imię i nazwisko."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def get_short_name(self):
        """Zwraca imię."""
        return self.first_name

    # Właściwości ról — wygodne sprawdzanie
    @property
    def is_admin(self):
        """Czy użytkownik jest administratorem?"""
        return self.role == UserRole.ADMIN

    @property
    def is_staff_member(self):
        """Czy użytkownik jest pracownikiem serwisu?"""
        return self.role == UserRole.STAFF

    @property
    def is_client(self):
        """Czy użytkownik jest klientem?"""
        return self.role == UserRole.CLIENT


class StaffSpecialization(models.TextChoices):
    """Specjalizacja pracownika (do auto-przypisania)."""
    PHONE_TABLET = "phone_tablet", _("Telefony, Tablety, Smartwatche")
    LAPTOP_PRINTER = "laptop_printer", _("Laptopy, komputery, konsole, drukarki")
    GENERAL = "general", _("Ogólne / proste naprawy")


class StaffProfile(models.Model):
    """
    Profil pracownika serwisu.
    Dodatkowe informacje o pracowniku.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff_profile",
        verbose_name=_("użytkownik"),
        limit_choices_to={"role": UserRole.STAFF},
    )
    position = models.CharField(_("stanowisko"), max_length=100, blank=True)
    bio = models.TextField(_("opis"), blank=True)
    avatar = models.FileField(_("zdjęcie"), upload_to="staff/avatars/", null=True, blank=True)
    is_available = models.BooleanField(_("dostępny do przypisania"), default=True)

    # Rozszerzenie (prokom.md): specjalizacja, kalendarz, podpisy
    specialization = models.CharField(
        _("specjalizacja"),
        max_length=30,
        choices=StaffSpecialization.choices,
        blank=True,
        db_index=True,
    )
    calendar_color = models.CharField(_("kolor w kalendarzu"), max_length=7, default="#3498db", blank=True)
    display_name = models.CharField(_("nazwa do podpisu"), max_length=100, blank=True)
    login_alias = models.CharField(_("alias w logach"), max_length=50, blank=True)
    is_visible_in_rankings = models.BooleanField(_("widoczny w rankingach"), default=True)
    accepts_shipment_repairs = models.BooleanField(
        _("przyjmuje naprawy wysyłkowe"),
        default=True,
        help_text=_("Czy pracownik może być przypisywany do napraw wysyłkowych"),
    )

    # Statystyki (będą aktualizowane przez sygnały / serwisy)
    total_repairs = models.PositiveIntegerField(_("łączna liczba napraw"), default=0)
    active_repairs = models.PositiveIntegerField(_("aktywne naprawy"), default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("profil pracownika")
        verbose_name_plural = _("profile pracowników")

    def __str__(self):
        return f"Profil: {self.user.get_full_name()}"


class LoginActivity(models.Model):
    """Log logowania użytkownika (IP, user_agent, status)."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="login_activities",
        verbose_name=_("użytkownik"),
        null=True,
        blank=True,
    )
    ip_address = models.GenericIPAddressField(_("adres IP"), null=True, blank=True)
    user_agent = models.CharField(_("user agent"), max_length=500, blank=True)
    login_status = models.CharField(
        _("status"),
        max_length=20,
        choices=[("success", _("Sukces")), ("failed", _("Niepowodzenie"))],
    )
    logged_in_at = models.DateTimeField(_("data logowania"), auto_now_add=True)

    class Meta:
        verbose_name = _("log logowania")
        verbose_name_plural = _("logi logowań")
        ordering = ["-logged_in_at"]

    def __str__(self):
        return f"{self.get_login_status_display()} — {self.user or '?'} @ {self.logged_in_at}"


class StaffNotification(models.Model):
    """
    Powiadomienie dla pracownika (Staff Notifications Center).
    Tylko w systemie (bez e-mail/SMS do staffu).
    """
    LOW = "low"
    STANDARD = "standard"
    IMPORTANT = "important"
    URGENT = "urgent"
    PRIORITY_CHOICES = [
        (LOW, _("niski")),
        (STANDARD, _("standardowy")),
        (IMPORTANT, _("ważny")),
        (URGENT, _("pilny")),
    ]
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"
    STATUS_CHOICES = [
        (UNREAD, _("nieprzeczytane")),
        (READ, _("przeczytane")),
        (ARCHIVED, _("zarchiwizowane")),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="staff_notifications",
        verbose_name=_("pracownik"),
    )
    notification_type = models.CharField(
        _("typ"),
        max_length=50,
        db_index=True,
        help_text=_("np. repair_assigned, client_message, note_added, quote_accepted, part_arrived, sla_exceeded"),
    )
    priority = models.CharField(
        _("priorytet"),
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=STANDARD,
        db_index=True,
    )
    repair = models.ForeignKey(
        "repairs.RepairRequest",
        on_delete=models.CASCADE,
        related_name="staff_notifications",
        verbose_name=_("naprawa"),
        null=True,
        blank=True,
    )
    title = models.CharField(_("tytuł"), max_length=200)
    description = models.TextField(_("opis"), blank=True)
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=STATUS_CHOICES,
        default=UNREAD,
        db_index=True,
    )
    link = models.CharField(
        _("link"),
        max_length=500,
        blank=True,
        help_text=_("Ścieżka do widoku, np. /staff/repairs/xxx"),
    )
    created_at = models.DateTimeField(_("data utworzenia"), auto_now_add=True)

    class Meta:
        verbose_name = _("powiadomienie pracownika")
        verbose_name_plural = _("powiadomienia pracowników")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status", "-created_at"]),
            models.Index(fields=["user", "notification_type"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.user.get_full_name()}"


class EmailVerificationCode(models.Model):
    """
    Jednorazowy kod OTP (6 cyfr) do weryfikacji e-maila przy rejestracji.
    Ważny 15 minut. Maks. 5 prób wpisania. Po 5 błędach kod unieważniany.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_verification_codes",
        verbose_name=_("użytkownik"),
    )
    code = models.CharField(_("kod"), max_length=6, db_index=True)
    expires_at = models.DateTimeField(_("ważny do"), db_index=True)
    failed_attempts = models.PositiveSmallIntegerField(_("błędne próby"), default=0)
    created_at = models.DateTimeField(_("utworzono"), auto_now_add=True)

    class Meta:
        verbose_name = _("kod weryfikacji e-mail")
        verbose_name_plural = _("kody weryfikacji e-mail")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "expires_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} — *** (wygaś. {self.expires_at})"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() >= self.expires_at

    @property
    def is_max_attempts_reached(self):
        return self.failed_attempts >= 5


class EmailVerificationAttempt(models.Model):
    """
    Log każdej próby weryfikacji e-maila (IP, czas, sukces/porażka).
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="verification_attempts",
        null=True,
        blank=True,
        verbose_name=_("użytkownik"),
    )
    email = models.CharField(_("e-mail"), max_length=255, db_index=True)
    ip_address = models.CharField(_("adres IP"), max_length=45, blank=True)
    success = models.BooleanField(_("sukces"), default=False)
    created_at = models.DateTimeField(_("data"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("próba weryfikacji e-mail")
        verbose_name_plural = _("próby weryfikacji e-mail")
        ordering = ["-created_at"]


class LoginFailureLog(models.Model):
    """
    Log nieudanych prób logowania (do limitów: 10 z IP / 15 min, 20 na konto / 15 min).
    """
    ip_address = models.CharField(_("adres IP"), max_length=45, db_index=True)
    email_lower = models.CharField(_("e-mail"), max_length=255, db_index=True)
    created_at = models.DateTimeField(_("data"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("log nieudanego logowania")
        verbose_name_plural = _("logi nieudanych logowań")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["ip_address", "-created_at"]),
            models.Index(fields=["email_lower", "-created_at"]),
        ]


class EmailVerificationSendLog(models.Model):
    """
    Log wysyłki kodu OTP (do limitów: 60s cooldown, max 5/godzinę na adres).
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="verification_send_logs",
        verbose_name=_("użytkownik"),
    )
    sent_at = models.DateTimeField(_("wysłano"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("log wysyłki kodu weryfikacji")
        verbose_name_plural = _("logi wysyłki kodu weryfikacji")
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["user", "-sent_at"]),
        ]


class PasswordResetToken(models.Model):
    """
    Token do resetu hasła (link w e-mailu). Ważny 1 godzina. Jednorazowy.
    Tylko dla klientów (role=client) — staff/admin reset przez panel.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name=_("użytkownik"),
    )
    token = models.CharField(_("token"), max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField(_("ważny do"), db_index=True)
    created_at = models.DateTimeField(_("utworzono"), auto_now_add=True)

    class Meta:
        verbose_name = _("token resetu hasła")
        verbose_name_plural = _("tokeny resetu hasła")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["token", "expires_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} — do {self.expires_at}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at
