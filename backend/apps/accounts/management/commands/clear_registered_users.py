"""
Usuwa wszystkie zarejestrowane konta (do czystego testu rejestracji / maili).

Zostawia tylko użytkowników z is_superadmin=True (odzyskiwanie systemu).
Po usunięciu możesz ponownie zarejestrować się lub uruchomić: python manage.py seed_initial

Uruchom: python manage.py clear_registered_users
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User


class Command(BaseCommand):
    help = "Usuwa wszystkie konta użytkowników (z wyjątkiem superadminów)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Usuń także superadminów (ostrożnie!).",
        )

    def handle(self, *args, **options):
        qs = User.objects.all()
        if not options["all"]:
            qs = qs.filter(is_superadmin=False)
        count = qs.count()
        if count == 0:
            self.stdout.write("Brak kont do usunięcia.")
            return
        with transaction.atomic():
            qs.delete()
        self.stdout.write(self.style.SUCCESS(f"Usunięto {count} kont."))
