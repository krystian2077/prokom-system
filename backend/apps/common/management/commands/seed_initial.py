"""
Seed startowy: konta pracowników i adminów + opcjonalnie dane słownikowe.

Tworzy:
- 5 kont: krystian, szef (admin), kuba, rafal, pawel (staff)
- Profile pracowników (specjalizacja, kolor w kalendarzu)
- Tymczasowe hasło + wymuszenie zmiany przy pierwszym logowaniu

Opcja --with-dicts: podstawowe marki, przykładowe hurtownie.

Uruchom: python manage.py seed_initial
         python manage.py seed_initial --with-dicts

Zmienne środowiskowe (opcjonalne):
- SEED_TEMP_PASSWORD — tymczasowe hasło (domyślnie: ZmienHaslo1!)
- SEED_EMAIL_DOMAIN — domena e-mail (domyślnie: prokom.local)
"""
import os
from django.core.management.base import BaseCommand
from django.db import transaction


# Konfiguracja kont (login = część przed @ w emailu; email = login@domena)
STAFF_ACCOUNTS = [
    {
        "login": "kuba",
        "first_name": "Jakub",
        "last_name": "Filas",
        "role": "staff",
        "specialization": "phone_tablet",  # Telefony, tablety, smartwatche, odzyskiwanie danych
        "calendar_color": "#3498db",
    },
    {
        "login": "rafal",
        "first_name": "Rafał",
        "last_name": "Smółka",
        "role": "staff",
        "specialization": "laptop_printer",  # Laptopy, komputery, drukarki, konsole
        "calendar_color": "#e74c3c",
    },
    {
        "login": "pawel",
        "first_name": "Paweł",
        "last_name": "Górka",
        "role": "staff",
        "specialization": "general",  # Proste naprawy serwisowe
        "calendar_color": "#2ecc71",
    },
]

ADMIN_ACCOUNTS = [
    {
        "login": "krystian",
        "first_name": "Krystian",
        "last_name": "Potaczek",
        "role": "admin",
        "specialization_label": "admin / zarządzanie systemem",
    },
    {
        "login": "szef",
        "first_name": "Szef",
        "last_name": "PRO-KOM",
        "role": "admin",
        "specialization_label": "admin / właściciel",
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
    {"name": "GSM Parts Poland", "nip": "", "email": "kontakt@example.pl", "phone": "", "city": "Warszawa"},
    {"name": "iParts", "nip": "", "email": "biuro@example.pl", "phone": "", "city": "Kraków"},
    {"name": "Mobilny Serwis Parts", "nip": "", "email": "sklep@example.pl", "phone": "", "city": "Poznań"},
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
            help="Nie pytaj o potwierdzenie; używaj domyślnego hasła.",
        )

    def handle(self, *args, **options):
        temp_password = os.environ.get("SEED_TEMP_PASSWORD", "ZmienHaslo1!")
        email_domain = os.environ.get("SEED_EMAIL_DOMAIN", "prokom.local")

        if not options["no_input"]:
            self.stdout.write(
                self.style.WARNING(
                    "Utworzone konta będą miały tymczasowe hasło i wymuszoną zmianę przy pierwszym logowaniu."
                )
            )
            self.stdout.write(f"Hasło tymczasowe: {temp_password}")
            self.stdout.write(f"E-mail: login@{email_domain} (np. kuba@{email_domain})")
            if not input("Kontynuować? [t/N]: ").strip().lower().startswith("t"):
                self.stdout.write("Anulowano.")
                return

        with transaction.atomic():
            self._create_users(email_domain, temp_password, options["with_dicts"])

        self._print_summary(email_domain, temp_password)

    def _create_users(self, email_domain, temp_password, with_dicts):
        from django.contrib.auth import get_user_model
        from apps.accounts.models import StaffProfile

        User = get_user_model()

        created_users = []
        for data in STAFF_ACCOUNTS + ADMIN_ACCOUNTS:
            login = data["login"]
            email = f"{login}@{email_domain}"
            user = User.objects.filter(email__iexact=email).first()
            created = False
            if not user:
                user = User(
                    email=email,
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    role=data["role"],
                    is_staff=True,
                    is_active=True,
                    must_change_password=True,
                )
                if data["role"] == "admin":
                    user.is_superuser = True
                user.set_password(temp_password)
                user.save()
                created = True
            created_users.append((user, created))

            if data["role"] == "staff":
                profile, profile_created = StaffProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        "specialization": data.get("specialization", ""),
                        "calendar_color": data.get("calendar_color", "#3498db"),
                        "is_available": True,
                    },
                )
                if not profile_created and data.get("specialization"):
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
                Supplier.objects.get_or_create(
                    name=s["name"],
                    defaults={
                        "nip": s.get("nip", ""),
                        "email": s.get("email", ""),
                        "phone": s.get("phone", ""),
                        "city": s.get("city", ""),
                        "is_active": True,
                    },
                )
            self.stdout.write(self.style.SUCCESS(f"  Hurtownie: {len(SUPPLIERS)} wpisów"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  Hurtownie: pominięto ({e})"))

    def _print_summary(self, email_domain, temp_password):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Konta startowe:"))
        self.stdout.write(f"  Logowanie: email = login@{email_domain} (np. kuba@{email_domain})")
        self.stdout.write(f"  Tymczasowe hasło: {temp_password}")
        self.stdout.write("  Wymuś zmianę hasła przy pierwszym logowaniu: TAK")
        self.stdout.write("")
        self.stdout.write("  Staff: kuba, rafal, pawel")
        self.stdout.write("  Admin: krystian, szef")
