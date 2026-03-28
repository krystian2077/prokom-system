"""Przykładowe zadania dla konta Kuba (podgląd UI)."""
import os
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.tasks.enums import TaskPriority, TaskStatus
from apps.tasks.models import Task


class Command(BaseCommand):
    help = "Dodaje przykładowe zadania przypisane do użytkownika Kuba (kuba@<domena>)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            default=None,
            help="Nadpisz e-mail (domyślnie: kuba@SEED_EMAIL_DOMAIN lub kuba@prokom.local).",
        )

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        domain = os.environ.get("SEED_EMAIL_DOMAIN", "prokom.local")
        email = (options["email"] or f"kuba@{domain}").strip().lower()
        kuba = User.objects.filter(email__iexact=email).first()
        if not kuba:
            self.stdout.write(self.style.ERROR(f"Brak użytkownika {email}. Uruchom najpierw: python manage.py seed_initial"))
            return

        now = timezone.now()
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        tomorrow = now + timedelta(days=1)

        samples = [
            {
                "title": "[demo] Sprawdzić kolejkę po części (iPhone 14)",
                "description": "Przykład zadania z terminem na dziś.",
                "status": TaskStatus.NEW,
                "priority": TaskPriority.STANDARD,
                "due_date": today_end,
                "completed_at": None,
            },
            {
                "title": "[demo] Pilne: oddzwonić do klienta w sprawie wyceny",
                "description": "Priorytet pilny.",
                "status": TaskStatus.IN_PROGRESS,
                "priority": TaskPriority.URGENT,
                "due_date": tomorrow,
                "completed_at": None,
            },
            {
                "title": "[demo] Czeka na potwierdzenie dostawy z hurtowni",
                "status": TaskStatus.WAITING,
                "priority": TaskPriority.IMPORTANT,
                "due_date": None,
                "completed_at": None,
            },
            {
                "title": "[demo] Nałożyć folię Hammer Glass przed wydaniem",
                "status": TaskStatus.NEW,
                "priority": TaskPriority.LOW,
                "due_date": None,
                "completed_at": None,
            },
            {
                "title": "[demo] Zakończone: aktualizacja statusu na stronie",
                "status": TaskStatus.COMPLETED,
                "priority": TaskPriority.STANDARD,
                "due_date": None,
                "completed_at": now.replace(hour=10, minute=30, second=0, microsecond=0),
            },
        ]

        created = 0
        skipped = 0
        for spec in samples:
            title = spec["title"]
            obj, was_created = Task.objects.get_or_create(
                title=title,
                assigned_to=kuba,
                defaults={
                    "created_by": kuba,
                    "description": spec.get("description", ""),
                    "status": spec["status"],
                    "priority": spec["priority"],
                    "due_date": spec.get("due_date"),
                    "completed_at": spec.get("completed_at"),
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(f"Zadania dla {email}: utworzono {created}, pominięto (już były) {skipped}."))
