"""
Czyści wszystkie dane klientów, napraw i urządzeń przed wdrożeniem produkcyjnym.
Konta pracowników i adminów zostają nienaruszone.

Uruchom: python manage.py clear_client_data
         python manage.py clear_client_data --no-input
"""
from django.core.management.base import BaseCommand
from django.db import transaction


MODELS_TO_CLEAR = [
    # Kolejność ważna — najpierw dzieci, potem rodzice
    ("apps.repairs", "RepairStatusHistory"),
    ("apps.repairs", "RepairAssignment"),
    ("apps.repairs", "RepairNote"),
    ("apps.repairs", "RepairImage"),
    ("apps.repairs", "RepairClaimSmsCode"),
    ("apps.repairs", "SatisfactionSurvey"),
    ("apps.repairs", "RepairVisitSchedule"),
    ("apps.repairs", "ReminderLog"),
    ("apps.repairs", "ChecklistRun"),
    ("apps.repairs", "TeamThreadMessage"),
    ("apps.repairs", "DiagnosticReport"),
    ("apps.repairs", "RepairRequest"),
    ("apps.devices", "DeviceImage"),
    ("apps.devices", "Device"),
    ("apps.clients", "ClientNote"),
    ("apps.clients", "ClientConsent"),
    ("apps.clients", "ClientAddress"),
    ("apps.clients", "Client"),
    ("apps.tasks", "Task"),
    ("apps.analytics", "EmployeeStatsSnapshot"),
    ("apps.common", "AuditLogEntry"),
    ("apps.calendar_app", "CalendarEvent"),
    ("apps.calendar_app", "TimeslotBlock"),
    ("apps.availability", "EmployeeAbsenceRequest"),
    ("apps.availability", "WorkSession"),
]


class Command(BaseCommand):
    help = "Usuwa wszystkie dane klientów i napraw. Konta pracowników zostają."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Nie pytaj o potwierdzenie.",
        )

    def handle(self, *args, **options):
        if not options["no_input"]:
            self.stdout.write(self.style.WARNING(
                "\nUWAGA: Ta operacja NIEODWRACALNIE usuwa wszystkie dane:"
            ))
            self.stdout.write("  - Klientów i ich dane kontaktowe")
            self.stdout.write("  - Wszystkie naprawy i ich historię")
            self.stdout.write("  - Urządzenia, notatki, zdjęcia, zadania")
            self.stdout.write("\nKonta pracowników i adminów ZOSTAJĄ.")
            self.stdout.write("")
            confirm = input("Wpisz TAK żeby potwierdzić: ").strip()
            if confirm != "TAK":
                self.stdout.write("Anulowano.")
                return

        total_deleted = 0
        with transaction.atomic():
            for app_label, model_name in MODELS_TO_CLEAR:
                try:
                    from django.apps import apps
                    model = apps.get_model(app_label, model_name)
                    count, _ = model.objects.all().delete()
                    if count:
                        self.stdout.write(f"  Usunięto {count:>5} wpisów: {model_name}")
                    total_deleted += count
                except LookupError:
                    self.stdout.write(self.style.WARNING(f"  Pominięto (brak modelu): {model_name}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  Błąd {model_name}: {e}"))

            # Reset sekwencji numerów napraw
            try:
                from django.apps import apps
                seq = apps.get_model("apps.repairs", "RepairNumberSequence")
                seq.objects.filter(pk=1).update(last_value=0)
                self.stdout.write("  Reset sekwencji numerów napraw → 0")
            except Exception:
                pass

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Gotowe. Usunięto łącznie {total_deleted} rekordów."))
        self.stdout.write("Konta pracowników i adminów są nienaruszone.")
