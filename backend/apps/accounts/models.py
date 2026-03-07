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
