"""
Ładowanie domyślnych szablonów wiadomości (e-mail i SMS) dla kluczowych etapów naprawy.
Uruchom: python manage.py seed_message_templates
"""
from django.core.management.base import BaseCommand

from apps.communications.models import MessageTemplate


TEMPLATES = [
    # E-mail — przyjęcie
    {
        "name": "Potwierdzenie przyjęcia (e-mail)",
        "channel": "email",
        "message_type": "status_update",
        "subject": "Przyjęto zgłoszenie {{repair_number}} — {{company_name}}",
        "body": "Dzień dobry {{client_name}},\n\nPotwierdzamy przyjęcie zgłoszenia nr {{repair_number}}.\nUrządzenie: {{device_name}}\nOpis: {{problem_description}}\n\nSzacowany czas realizacji: {{estimated_duration}}\nWięcej szczegółów w panelu klienta.\n\nPozdrawiamy,\n{{company_name}}",
        "suggested_for_status": "accepted",
        "sort_order": 10,
    },
    # SMS — przyjęcie
    {
        "name": "Potwierdzenie przyjęcia (SMS)",
        "channel": "sms",
        "message_type": "status_update",
        "subject": "",
        "body": "{{company_name}}: Przyjęto zgłoszenie {{repair_number}}. {{device_name}}. Szac. czas: {{estimated_duration}}. Szczegóły: panel / e-mail.",
        "suggested_for_status": "accepted",
        "sort_order": 11,
    },
    # E-mail — wycena wysłana
    {
        "name": "Wycena wysłana (e-mail)",
        "channel": "email",
        "message_type": "quote",
        "subject": "Wycena naprawy {{repair_number}} — {{company_name}}",
        "body": "Dzień dobry {{client_name}},\n\nPrzesyłamy wycenę naprawy nr {{repair_number}} ({{device_name}}).\nSzacowana data odbioru: {{estimated_completion_date}}\nSzacowany czas: {{estimated_duration}}\n\nProsimy o decyzję — w panelu klienta lub odpowieć na ten e-mail.\n\nPozdrawiamy,\n{{company_name}}",
        "suggested_for_status": "quote_sent",
        "sort_order": 20,
    },
    # SMS — wycena
    {
        "name": "Wycena wysłana (SMS)",
        "channel": "sms",
        "message_type": "quote",
        "subject": "",
        "body": "{{company_name}}: Wycena {{repair_number}} czeka na decyzję. Odbiór ok. {{estimated_completion_date}}. Szczegóły w panelu / e-mail.",
        "suggested_for_status": "quote_sent",
        "sort_order": 21,
    },
    # E-mail — gotowe do odbioru
    {
        "name": "Gotowe do odbioru (e-mail)",
        "channel": "email",
        "message_type": "status_update",
        "subject": "Urządzenie gotowe do odbioru — {{repair_number}}",
        "body": "Dzień dobry {{client_name}},\n\nNaprawa nr {{repair_number}} ({{device_name}}) jest gotowa do odbioru.\nProsimy o odbiór w ustalonym terminie.\n\nPozdrawiamy,\n{{company_name}}",
        "suggested_for_status": "ready_for_pickup",
        "sort_order": 30,
    },
    # SMS — gotowe do odbioru
    {
        "name": "Gotowe do odbioru (SMS)",
        "channel": "sms",
        "message_type": "status_update",
        "subject": "",
        "body": "{{company_name}}: Naprawa {{repair_number}} gotowa do odbioru. Zapraszamy.",
        "suggested_for_status": "ready_for_pickup",
        "sort_order": 31,
    },
    # Przypomnienie o decyzji
    {
        "name": "Przypomnienie o decyzji (e-mail)",
        "channel": "email",
        "message_type": "reminder",
        "subject": "Przypomnienie: wycena {{repair_number}} czeka na decyzję",
        "body": "Dzień dobry {{client_name}},\n\nPrzypominamy o wycenie naprawy nr {{repair_number}}. Czekamy na Pani/Pana decyzję.\nW razie pytań jesteśmy do dyspozycji.\n\nPozdrawiamy,\n{{company_name}}",
        "suggested_for_status": "quote_sent",
        "sort_order": 40,
    },
    {
        "name": "Przypomnienie o decyzji (SMS)",
        "channel": "sms",
        "message_type": "reminder",
        "subject": "",
        "body": "{{company_name}}: Przypomnienie — wycena {{repair_number}} czeka na decyzję. Szczegóły: panel / e-mail.",
        "suggested_for_status": "quote_sent",
        "sort_order": 41,
    },
    # Oczekiwanie na część
    {
        "name": "Oczekiwanie na część (e-mail)",
        "channel": "email",
        "message_type": "status_update",
        "subject": "Aktualizacja naprawy {{repair_number}} — oczekiwanie na część",
        "body": "Dzień dobry {{client_name}},\n\nInformujemy, że naprawa nr {{repair_number}} jest w oczekiwaniu na część. Szacowana data odbioru: {{estimated_completion_date}}.\n\nPozdrawiamy,\n{{company_name}}",
        "suggested_for_status": "waiting_for_parts",
        "sort_order": 50,
    },
]


class Command(BaseCommand):
    help = "Tworzy domyślne szablony wiadomości (e-mail i SMS). Idempotentne — po name+channel nie duplikuje."

    def handle(self, *args, **options):
        created = 0
        for t in TEMPLATES:
            _, c = MessageTemplate.objects.get_or_create(
                name=t["name"],
                channel=t["channel"],
                defaults={
                    "message_type": t["message_type"],
                    "subject": t.get("subject", ""),
                    "body": t["body"],
                    "suggested_for_status": t.get("suggested_for_status", ""),
                    "sort_order": t.get("sort_order", 0),
                    "is_active": True,
                },
            )
            if c:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  Utworzono: {t['name']}"))
        self.stdout.write(self.style.SUCCESS(f"Zakończono. Utworzono {created} szablonów."))
