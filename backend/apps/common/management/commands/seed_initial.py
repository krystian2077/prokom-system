"""
Seed startowy: konta pracowników i adminów + opcjonalnie dane słownikowe.

Tworzy lub aktualizuje konta produkcyjne PRO-KOM.
Bezpieczny do wielokrotnego uruchamiania (idempotentny).

Opcja --with-dicts: podstawowe marki, przykładowe hurtownie.

Uruchom: python manage.py seed_initial
         python manage.py seed_initial --with-dicts
         python manage.py seed_initial --no-input
"""
import os
from django.core.management.base import BaseCommand
from django.db import transaction

EMAIL_DOMAIN = "prokom.local"

STAFF_ACCOUNTS = [
    {
        "login": "kuba",
        "first_name": "Jakub",
        "last_name": "Filas",
        "role": "staff",
        "password": "KubaKompro123!",
        "specialization": "phone_tablet",
        "calendar_color": "#3498db",
    },
    {
        "login": "rafal",
        "first_name": "Rafał",
        "last_name": "Smółka",
        "role": "staff",
        "password": "RafalKompro123!",
        "specialization": "laptop_printer",
        "calendar_color": "#e74c3c",
    },
    {
        "login": "pawelg",
        "first_name": "Paweł",
        "last_name": "Górka",
        "role": "staff",
        "password": "PawelgKompro123!",
        "specialization": "general",
        "calendar_color": "#2ecc71",
    },
    {
        "login": "pawelw",
        "first_name": "Paweł",
        "last_name": "Wójciak",
        "role": "staff",
        "password": "PawelwKompro123!",
        "specialization": "general",
        "calendar_color": "#f39c12",
    },
]

ADMIN_ACCOUNTS = [
    {
        "login": "krystian",
        "first_name": "Krystian",
        "last_name": "Potaczek",
        "role": "admin",
        "password": "KrystianKompro123!",
    },
    {
        "login": "tadek",
        "first_name": "Tadek",
        "last_name": "PRO-KOM",
        "role": "admin",
        "password": "TadekKompro123!",
    },
]

# Marki (do --with-dicts)
BRANDS = [
    "Apple",
    "Samsung",
    "Xiaomi",
    "Huawei",
    "Lenovo",
    "HP",
    "Dell",
    "Brother",
    "Asus",
    "Sony",
]

# Przykładowe hurtownie (do --with-dicts)
SUPPLIERS = [
    {"name": "GSM Parts Poland", "nip": "", "email": "kontakt@example.pl", "phone": "", "city": "Warszawa", "average_delivery_days": 2},
    {"name": "iParts", "nip": "", "email": "biuro@example.pl", "phone": "", "city": "Kraków", "average_delivery_days": 3},
    {"name": "Mobilny Serwis Parts", "nip": "", "email": "sklep@example.pl", "phone": "", "city": "Poznań", "average_delivery_days": 5},
]


class Command(BaseCommand):
    help = "Tworzy konta startowe (admin + staff) oraz opcjonalnie dane słownikowe (marki, hurtownie)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-dicts",
            action="store_true",
            help="Dodaj także podstawowe marki i przykładowe hurtownie.",
        )
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Nie pytaj o potwierdzenie.",
        )

    def handle(self, *args, **options):
        if not options["no_input"]:
            self.stdout.write(self.style.WARNING(
                "Utworzy/zaktualizuje konta produkcyjne PRO-KOM."
            ))
            if not input("Kontynuować? [t/N]: ").strip().lower().startswith("t"):
                self.stdout.write("Anulowano.")
                return

        with transaction.atomic():
            self._create_users(options["with_dicts"])

        self._print_summary()

    def _create_users(self, with_dicts):
        from django.contrib.auth import get_user_model
        from apps.accounts.models import StaffProfile

        User = get_user_model()

        for data in STAFF_ACCOUNTS + ADMIN_ACCOUNTS:
            email = f"{data['login']}@{EMAIL_DOMAIN}"
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                user = User(
                    email=email,
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    role=data["role"],
                    is_staff=True,
                    is_active=True,
                    must_change_password=False,
                )
                if data["role"] == "admin":
                    user.is_superuser = True
                user.set_password(data["password"])
                user.save()
                self.stdout.write(self.style.SUCCESS(f"  Utworzono: {email}"))
            else:
                self.stdout.write(f"  Już istnieje: {email}")

            if data["role"] == "staff":
                profile, _ = StaffProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        "specialization": data.get("specialization", ""),
                        "calendar_color": data.get("calendar_color", "#3498db"),
                        "is_available": True,
                    },
                )
                if data.get("specialization"):
                    profile.specialization = data["specialization"]
                    profile.calendar_color = data.get("calendar_color", "#3498db")
                    profile.save()

        if with_dicts:
            self._seed_dicts()

    def _seed_dicts(self):
        from django.utils.text import slugify

        # Marki (devices.Brand)
        try:
            from apps.devices.models import Brand

            for name in BRANDS:
                slug = slugify(name)
                Brand.objects.get_or_create(slug=slug, defaults={"name": name})
            self.stdout.write(self.style.SUCCESS(f"  Marki: {len(BRANDS)} wpisów"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  Marki: pominięto ({e})"))

        # Hurtownie (inventory.Supplier)
        try:
            from apps.inventory.models import Supplier

            for s in SUPPLIERS:
                Supplier.objects.update_or_create(
                    name=s["name"],
                    defaults={
                        "nip": s.get("nip", ""),
                        "email": s.get("email", ""),
                        "phone": s.get("phone", ""),
                        "city": s.get("city", ""),
                        "average_delivery_days": s.get("average_delivery_days"),
                        "is_active": True,
                    },
                )
            self.stdout.write(self.style.SUCCESS(f"  Hurtownie: {len(SUPPLIERS)} wpisów"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  Hurtownie: pominięto ({e})"))

    def _print_summary(self):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Konta produkcyjne PRO-KOM:"))
        self.stdout.write(f"  Domena e-mail: @{EMAIL_DOMAIN}")
        self.stdout.write("")
        self.stdout.write("  Admin:    krystian@prokom.local  |  tadek@prokom.local")
        self.stdout.write("  Staff:    kuba@prokom.local  |  rafal@prokom.local")
        self.stdout.write("            pawelg@prokom.local  |  pawelw@prokom.local")
