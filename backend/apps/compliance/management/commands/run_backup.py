"""
Ręczne wywołanie backupu (baza i/lub media).
Uruchom: python manage.py run_backup [database|media|full]
Domyślnie: database.
"""
from django.core.management.base import BaseCommand
from apps.compliance.tasks import run_backup


class Command(BaseCommand):
    help = "Wywołuje task backupu (database | media | full). Domyślnie: database."

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            nargs="?",
            default="database",
            choices=["database", "media", "full"],
        )
        parser.add_argument(
            "--sync",
            action="store_true",
            help="Wykonaj synchronicznie (bez Celery); przy braku workera.",
        )

    def handle(self, *args, **options):
        backup_type = options["type"]
        if options["sync"]:
            result = run_backup.apply(args=[backup_type], kwargs={"triggered_by_id": None}).get()
            self.stdout.write(self.style.SUCCESS(f"Backup ({backup_type}): {result.get('status', 'done')}"))
        else:
            run_backup.delay(backup_type, triggered_by_id=None)
            self.stdout.write(self.style.SUCCESS(f"Zadanie backupu ({backup_type}) dodane do kolejki Celery."))
