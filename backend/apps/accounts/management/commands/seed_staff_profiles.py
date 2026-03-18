"""
Tworzy konta pracowników (Kuba, Rafał) i ustawia specjalizacje w StaffProfile.

- Kuba: serwis telefonów, tabletów, czasem laptopów (PHONE_TABLET)
- Rafał: serwis laptopów, komputerów, drukarek, konsol (LAPTOP_PRINTER)
- Krystian (admin) może przypisywać zgłoszenia dowolnemu pracownikowi.

Uruchom: python manage.py seed_staff_profiles
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User, UserRole, StaffProfile, StaffSpecialization


class Command(BaseCommand):
    help = "Tworzy/aktualizuje konta Kuba i Rafał oraz ustawia specjalizacje (StaffProfile)."

    def handle(self, *args, **options):
        with transaction.atomic():
            # Kuba — telefony, tablety, czasem laptopy
            kuba, created = User.objects.update_or_create(
                email="kuba@prokom.local",
                defaults={
                    "first_name": "Kuba",
                    "role": UserRole.STAFF,
                    "is_staff": True,
                    "is_active": True,
                },
            )
            if created:
                kuba.set_password("Kuba123")
                kuba.save(update_fields=["password"])
                self.stdout.write("Utworzono konto: Kuba (kuba@prokom.local, hasło: Kuba123)")
            else:
                self.stdout.write("Konto Kuba już istnieje.")

            profile_kuba, _ = StaffProfile.objects.get_or_create(
                user=kuba,
                defaults={"specialization": StaffSpecialization.PHONE_TABLET, "is_available": True},
            )
            if profile_kuba.specialization != StaffSpecialization.PHONE_TABLET:
                profile_kuba.specialization = StaffSpecialization.PHONE_TABLET
                profile_kuba.save(update_fields=["specialization"])
            self.stdout.write("  -> StaffProfile: specjalizacja Telefony, tablety (PHONE_TABLET)")

            # Rafał — laptopy, komputery, drukarki, konsole
            rafal, created = User.objects.update_or_create(
                email="rafal@prokom.local",
                defaults={
                    "first_name": "Rafał",
                    "role": UserRole.STAFF,
                    "is_staff": True,
                    "is_active": True,
                },
            )
            if created:
                rafal.set_password("Rafal123")
                rafal.save(update_fields=["password"])
                self.stdout.write("Utworzono konto: Rafał (rafal@prokom.local, hasło: Rafal123)")
            else:
                self.stdout.write("Konto Rafał już istnieje.")

            profile_rafal, _ = StaffProfile.objects.get_or_create(
                user=rafal,
                defaults={"specialization": StaffSpecialization.LAPTOP_PRINTER, "is_available": True},
            )
            if profile_rafal.specialization != StaffSpecialization.LAPTOP_PRINTER:
                profile_rafal.specialization = StaffSpecialization.LAPTOP_PRINTER
                profile_rafal.save(update_fields=["specialization"])
            self.stdout.write("  -> StaffProfile: specjalizacja Laptopy, komputery, drukarki (LAPTOP_PRINTER)")

        self.stdout.write(self.style.SUCCESS("Gotowe. Krystian (admin) może przypisywać zgłoszenia w panelu."))
