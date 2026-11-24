"""
seed_demo — fictional, realistic repairs for staff-panel screenshots (STAGING / local only).

    python manage.py seed_demo                          # dry run: prints the plan, writes nothing
    python manage.py seed_demo --yes-staging            # removes previous demo, loads fresh demo data
    python manage.py seed_demo --clear --yes-staging    # removes demo data only

Safety:
- refuses to run unless the database is local SQLite or exactly `prokom_tech_staging`
  and ALLOWED_HOSTS contains no production domain;
- everything runs in one transaction;
- e-mail backend switched to locmem and Celery `apply_async` blocked for the whole run;
- demo records are found by two markers (`[DEMO]` prefix in internal notes + `demo.*@example.com`
  e-mail) intersected with the ID registry kept in SystemSetting `seed_demo.registry`.
  Nothing else is ever modified or deleted.
"""
import secrets
from contextlib import contextmanager
from datetime import datetime, time, timedelta
from decimal import Decimal
from unittest import mock

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.db.models import Q
from django.test.utils import override_settings
from django.utils import timezone

from apps.accounts.models import StaffNotification, StaffProfile, StaffSpecialization, UserRole
from apps.clients.models import Client
from apps.common.enums import (
    ClientType,
    DeviceCategory,
    PaymentStatus,
    RepairPriority,
    RepairSource,
    RepairStatus,
)
from apps.compliance.models import SystemSetting
from apps.devices.models import Brand, Device
from apps.inventory.models import PartUsage
from apps.inventory.models.part_usage import PartOrderStatus, PartUsageStatus
from apps.pricing.models import Quote, QuoteDecision, QuoteItem
from apps.pricing.models.quote import QuoteItemType, QuoteStatus
from apps.repairs.models import (
    RepairAssignment,
    RepairNote,
    RepairNoteThreadOrigin,
    RepairRequest,
    RepairStatusHistory,
)
from apps.tasks.enums import TaskPriority, TaskStatus
from apps.tasks.models import Task

User = get_user_model()

DEMO_MARK = "[DEMO]"
DEMO_EMAIL_DOMAIN = "@example.com"
DEMO_EMAIL_PREFIX = "demo."
DEMO_USER_EMAIL = "demo.serwisant@example.com"
REGISTRY_KEY = "seed_demo.registry"

STAGING_DB_NAME = "prokom_tech_staging"
PRODUCTION_HOSTS = {"prokomserwis.pl", "www.prokomserwis.pl", ".prokomserwis.pl", "*"}
PRODUCTION_DB_NAMES = {"prokom_db", "prokom_tech_prod"}
TEST_AUDIT_PHRASE = "TEST AUDYT"


# ---------------------------------------------------------------------------
# Environment guard
# ---------------------------------------------------------------------------
def detect_environment(engine: str, db_name: str, allowed_hosts) -> str:
    """
    Returns "local" or "staging". Raises CommandError for anything else
    (production or not unambiguously identifiable).
    """
    engine = (engine or "").lower()
    name = str(db_name or "")
    hosts = {str(h).strip().lower() for h in (allowed_hosts or [])}

    prod_hosts = sorted(hosts & PRODUCTION_HOSTS)
    if prod_hosts:
        raise CommandError(
            f"Odmowa: ALLOWED_HOSTS zawiera domenę produkcji ({', '.join(prod_hosts)}). "
            "seed_demo działa tylko na stagingu i lokalnie."
        )
    if "sqlite" in engine:
        return "local"
    if "prod" in name.lower() or name in PRODUCTION_DB_NAMES:
        raise CommandError(f"Odmowa: baza „{name}” wygląda na produkcyjną.")
    if name == STAGING_DB_NAME:
        return "staging"
    raise CommandError(
        f"Odmowa: nie da się jednoznacznie stwierdzić, że to staging (baza „{name}”, silnik {engine}). "
        f"Dozwolone: lokalny SQLite albo baza „{STAGING_DB_NAME}”."
    )


def current_db_info():
    sd = connection.settings_dict
    return sd.get("ENGINE", ""), sd.get("NAME", ""), list(settings.ALLOWED_HOSTS)


# ---------------------------------------------------------------------------
# Outbound communication guard
# ---------------------------------------------------------------------------
@contextmanager
def no_outbound_communication():
    """locmem e-mail + every Celery task enqueue swallowed (nothing reaches the broker)."""
    blocked = []

    def _blocked_apply_async(task_self, *args, **kwargs):
        blocked.append(getattr(task_self, "name", "?"))
        return None

    with override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
        with mock.patch("celery.app.task.Task.apply_async", _blocked_apply_async):
            yield blocked


# ---------------------------------------------------------------------------
# Demo data definition
# ---------------------------------------------------------------------------
CLIENTS = [
    # key, first, last, city, phone, business
    ("anna", "Anna", "K.", "Rabka-Zdrój", "+48 111 222 301", False),
    ("marek", "Marek", "W.", "Nowy Targ", "+48 111 222 302", False),
    ("ewa", "Ewa", "S.", "Zakopane", "+48 111 222 303", False),
    ("tomasz", "Tomasz", "B.", "Rabka-Zdrój", "+48 111 222 304", False),
    ("firma", "Firma Demo", "Sp. z o.o.", "Mszana Dolna", "+48 111 222 305", True),
    ("katarzyna", "Katarzyna", "M.", "Mszana Dolna", "+48 111 222 306", False),
    ("pawel", "Paweł", "J.", "Zakopane", "+48 111 222 307", False),
    ("agnieszka", "Agnieszka", "R.", "Rabka-Zdrój", "+48 111 222 308", False),
    ("michal", "Michał", "L.", "Nowy Targ", "+48 111 222 309", False),
    ("joanna", "Joanna", "P.", "Zakopane", "+48 111 222 310", False),
]

# Timestamps: (days_ago, "HH:MM"). Dates relative to the run day.
REPAIRS = [
    {
        "client": "anna", "category": DeviceCategory.PHONE, "brand": "Apple", "model": "iPhone 15",
        "color": "czarny", "status": RepairStatus.IN_REPAIR, "accepted": (2, "10:15"), "due": 0,
        "problem": "Telefon spadł mi na kafelki, ekran pękł i dotyk działa tylko na dole — góra w ogóle nie reaguje.",
        "internal": "Uszkodzony digitizer, wymiana modułu OLED (zamiennik premium). Przenieść True Tone, po montażu test Face ID i czujnika zbliżeniowego.",
        "accessories": "Etui silikonowe, bez ładowarki",
        "visual": "Pęknięta szyba w lewym górnym rogu, drobne rysy na ramce przy przycisku zasilania",
        "history": [
            (RepairStatus.NEW, (2, "10:15"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (2, "10:40"), ""),
            (RepairStatus.QUOTE_SENT, (2, "11:30"), "Wycena: wymiana ekranu"),
            (RepairStatus.QUOTE_ACCEPTED, (2, "13:05"), "Klient zaakceptował telefonicznie"),
            (RepairStatus.IN_REPAIR, (0, "09:10"), ""),
        ],
        "quote": {"status": QuoteStatus.ACCEPTED, "sent": (2, "11:30"), "decided": (2, "13:05"), "items": [
            (QuoteItemType.PART, "Wyświetlacz OLED iPhone 15 (zamiennik premium)", "899.00", "0"),
            (QuoteItemType.LABOUR, "Wymiana ekranu, test Face ID", "0", "200.00"),
        ]},
        "messages": [
            (RepairNoteThreadOrigin.CLIENT, (1, "17:42"), "Dzień dobry, czy telefon będzie gotowy na jutro? Potrzebuję go do pracy."),
            (RepairNoteThreadOrigin.STAFF, (0, "08:55"), "Dzień dobry, ekran jest już na miejscu — telefon będzie gotowy dziś po 15:00."),
        ],
    },
    {
        "client": "marek", "category": DeviceCategory.PHONE, "brand": "Samsung", "model": "Galaxy S24",
        "color": "szary", "status": RepairStatus.WAITING_FOR_PARTS, "accepted": (3, "12:20"), "due": 1,
        "problem": "Bateria trzyma pół dnia, a jak jest zimno to telefon potrafi się wyłączyć przy 30%.",
        "internal": "Zużycie ogniwa 81% (test pojemności). Zamówiona bateria EB-BS921ABY, dotarła dziś — zamontować, kalibracja i test ładowania 25 W.",
        "accessories": "Bez akcesoriów",
        "visual": "Stan dobry, folia ochronna na ekranie, lekkie przetarcia na rogach",
        "history": [
            (RepairStatus.NEW, (3, "12:20"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (3, "13:00"), ""),
            (RepairStatus.QUOTE_SENT, (3, "14:10"), "Wycena: wymiana baterii"),
            (RepairStatus.QUOTE_ACCEPTED, (3, "15:30"), "Akceptacja w panelu klienta"),
            (RepairStatus.WAITING_FOR_PARTS, (2, "09:00"), "Bateria zamówiona w hurtowni"),
        ],
        "quote": {"status": QuoteStatus.ACCEPTED, "sent": (3, "14:10"), "decided": (3, "15:30"), "items": [
            (QuoteItemType.PART, "Bateria Samsung Galaxy S24 (EB-BS921ABY)", "229.00", "0"),
            (QuoteItemType.LABOUR, "Wymiana baterii, nowe uszczelnienie", "0", "120.00"),
        ]},
        "part": {"name": "Bateria Samsung Galaxy S24 (EB-BS921ABY)", "ordered": (2, "09:00"), "cost": "165.00", "price": "229.00"},
        "messages": [
            (RepairNoteThreadOrigin.CLIENT, (0, "09:30"), "Czy bateria już dotarła? Mogę odebrać telefon jutro rano?"),
            (RepairNoteThreadOrigin.STAFF, (0, "10:05"), "Bateria dotarła dziś, montujemy jeszcze dziś. Telefon będzie gotowy jutro od 9:00."),
        ],
    },
    {
        "client": "ewa", "category": DeviceCategory.LAPTOP, "brand": "Lenovo", "model": "Legion 5",
        "color": "czarny", "status": RepairStatus.READY_FOR_PICKUP, "accepted": (4, "11:00"), "due": -1,
        "problem": "Laptop strasznie się grzeje i wyje wentylator, w grach wyłącza się po kilkunastu minutach.",
        "internal": "Radiator zapchany kurzem, pasta wyschnięta. Czyszczenie, pasta termoprzewodząca, nowe termopady VRAM. Test obciążeniowy 30 min: CPU max 86°C.",
        "accessories": "Zasilacz 230 W",
        "visual": "Zarysowania na klapie, brak gumowej nóżki z tyłu",
        "history": [
            (RepairStatus.NEW, (4, "11:00"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (4, "11:30"), ""),
            (RepairStatus.QUOTE_SENT, (4, "12:15"), ""),
            (RepairStatus.QUOTE_ACCEPTED, (4, "12:40"), "Akceptacja telefoniczna"),
            (RepairStatus.IN_REPAIR, (2, "10:00"), ""),
            (RepairStatus.IN_TESTING, (1, "13:30"), "Test obciążeniowy"),
            (RepairStatus.READY_FOR_PICKUP, (1, "15:40"), "Klient powiadomiony"),
        ],
        "quote": {"status": QuoteStatus.ACCEPTED, "sent": (4, "12:15"), "decided": (4, "12:40"), "items": [
            (QuoteItemType.LABOUR, "Czyszczenie układu chłodzenia, pasta i termopady", "40.00", "209.00"),
        ]},
        "completed": (1, "15:20"), "ready": (1, "15:40"), "final": "249.00",
    },
    {
        "client": "tomasz", "category": DeviceCategory.PHONE, "brand": "Xiaomi", "model": "Redmi Note 13",
        "color": "niebieski", "status": RepairStatus.NEW, "accepted": (0, "08:20"), "due": 0, "urgent": True,
        "problem": "Telefon przestał się ładować, kabel trzeba trzymać pod kątem, a teraz już nic. Potrzebuję go pilnie.",
        "internal": "Wycena do przygotowania. Wstępnie: wymiana gniazda USB-C (płytka ładowania), sprawdzić ślady wilgoci.",
        "accessories": "Kabel USB-C",
        "visual": "Pęknięte szkło na aparacie, poza tym stan dobry",
        "history": [(RepairStatus.NEW, (0, "08:20"), "Przyjęcie w serwisie — pilne")],
    },
    {
        "client": "firma", "category": DeviceCategory.PRINTER, "brand": "HP", "model": "LaserJet Pro M404",
        "color": "biały", "status": RepairStatus.IN_DIAGNOSTICS, "accepted": (1, "09:45"), "due": 1,
        "problem": "Drukarka w biurze zacina papier co kilka stron, czasem wciąga dwie kartki naraz.",
        "internal": "Podejrzenie: zużyta rolka pobierająca i separator tacy 2. Sprawdzić utrwalacz (licznik 87 tys. stron).",
        "accessories": "Kabel zasilający, taca 2",
        "visual": "Obudowa zakurzona, przebarwienia na pokrywie",
        "history": [
            (RepairStatus.NEW, (1, "09:45"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (0, "09:30"), ""),
        ],
    },
    {
        "client": "katarzyna", "category": DeviceCategory.LAPTOP, "brand": "Dell", "model": "Latitude 5520",
        "color": "szary", "status": RepairStatus.IN_REPAIR, "accepted": (2, "15:10"), "due": 1,
        "problem": "Komputer bardzo wolno się uruchamia i wszystko się zacina, nawet przeglądarka.",
        "internal": "Dysk HDD z relokowanymi sektorami (SMART). Montaż SSD 1 TB NVMe, klonowanie systemu i danych, kopia zapasowa zrobiona przed klonowaniem.",
        "accessories": "Zasilacz, torba",
        "visual": "Wytarta podkładka dotykowa, stan ogólny dobry",
        "backup": True,
        "history": [
            (RepairStatus.NEW, (2, "15:10"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (2, "15:40"), ""),
            (RepairStatus.QUOTE_SENT, (1, "09:20"), ""),
            (RepairStatus.QUOTE_ACCEPTED, (1, "10:45"), "Akceptacja w panelu klienta"),
            (RepairStatus.IN_REPAIR, (0, "08:40"), "Klonowanie danych"),
        ],
        "quote": {"status": QuoteStatus.ACCEPTED, "sent": (1, "09:20"), "decided": (1, "10:45"), "items": [
            (QuoteItemType.PART, "Dysk SSD 1 TB NVMe", "349.00", "0"),
            (QuoteItemType.LABOUR, "Montaż SSD i przeniesienie danych", "0", "180.00"),
        ]},
    },
    {
        "client": "pawel", "category": DeviceCategory.TABLET, "brand": "Apple", "model": "iPad 10. gen.",
        "color": "srebrny", "status": RepairStatus.QUOTE_SENT, "accepted": (1, "11:30"), "due": 3,
        "problem": "Syn upuścił tablet, szyba jest zbita w pajęczynkę, ale obraz jest.",
        "internal": "LCD sprawny, uszkodzony tylko digitizer. Wymiana digitizera, ramka do doklejenia. Czekamy na decyzję klienta.",
        "accessories": "Etui z klawiaturą",
        "visual": "Zbita szyba (pajęczynka od prawego dolnego rogu), wgniecenie na rogu obudowy",
        "history": [
            (RepairStatus.NEW, (1, "11:30"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (1, "13:00"), ""),
            (RepairStatus.QUOTE_SENT, (1, "16:00"), "Wycena wysłana e-mailem"),
        ],
        "quote": {"status": QuoteStatus.SENT, "sent": (1, "16:00"), "items": [
            (QuoteItemType.PART, "Digitizer iPad 10. gen.", "429.00", "0"),
            (QuoteItemType.LABOUR, "Wymiana digitizera", "0", "170.00"),
        ]},
        "messages": [
            (RepairNoteThreadOrigin.CLIENT, (0, "10:20"), "Czy szyba będzie oryginalna? I ile to potrwa po akceptacji?"),
        ],
    },
    {
        "client": "agnieszka", "category": DeviceCategory.PHONE, "brand": "Google", "model": "Pixel 8",
        "color": "miętowy", "status": RepairStatus.NEW, "accepted": (0, "11:05"), "due": None,
        "unassigned": True, "source": RepairSource.ONLINE,
        "problem": "Tylny aparat nie działa — aplikacja pokazuje czarny ekran, przedni działa normalnie.",
        "internal": "Do diagnozy: moduł aparatu głównego albo taśma. Zgłoszenie z formularza online.",
        "accessories": "Bez akcesoriów",
        "visual": "Rysy na tylnym szkle wokół wyspy aparatów",
        "history": [(RepairStatus.NEW, (0, "11:05"), "Zgłoszenie z formularza online")],
    },
    {
        "client": "michal", "category": DeviceCategory.LAPTOP, "brand": "MSI", "model": "Katana 15",
        "color": "czarny", "status": RepairStatus.PICKED_UP, "accepted": (9, "10:00"), "due": -4,
        "problem": "Wylałem colę na klawiaturę, część klawiszy nie działa, a niektóre same się wciskają.",
        "internal": "Zalanie klawiatury, płyta główna bez śladów korozji. Wymiana klawiatury z podświetleniem, czyszczenie ultradźwiękowe okolic złącza.",
        "accessories": "Zasilacz",
        "visual": "Ślady zalania na klawiaturze, klejące się klawisze WASD",
        "paid": True,
        "history": [
            (RepairStatus.NEW, (9, "10:00"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (9, "11:00"), ""),
            (RepairStatus.QUOTE_SENT, (8, "10:30"), ""),
            (RepairStatus.QUOTE_ACCEPTED, (8, "12:00"), ""),
            (RepairStatus.WAITING_FOR_PARTS, (8, "12:30"), "Klawiatura zamówiona"),
            (RepairStatus.IN_REPAIR, (5, "09:30"), ""),
            (RepairStatus.READY_FOR_PICKUP, (4, "16:10"), "Klient powiadomiony"),
            (RepairStatus.PICKED_UP, (3, "14:30"), "Odbiór osobisty, płatność kartą"),
        ],
        "quote": {"status": QuoteStatus.ACCEPTED, "sent": (8, "10:30"), "decided": (8, "12:00"), "items": [
            (QuoteItemType.PART, "Klawiatura MSI Katana 15 z podświetleniem", "289.00", "0"),
            (QuoteItemType.LABOUR, "Wymiana klawiatury, czyszczenie po zalaniu", "0", "160.00"),
        ]},
        "completed": (4, "15:50"), "ready": (4, "16:10"), "picked": (3, "14:30"), "final": "449.00",
    },
    {
        "client": "joanna", "category": DeviceCategory.SMARTWATCH, "brand": "Apple", "model": "Watch Series 9",
        "color": "północ", "status": RepairStatus.PICKED_UP, "accepted": (5, "13:15"), "due": -1,
        "problem": "Zegarek wytrzymuje tylko do południa, wcześniej starczał na cały dzień.",
        "internal": "Kondycja baterii 74%. Wymiana ogniwa, nowa uszczelka ekranu, test szczelności.",
        "accessories": "Ładowarka magnetyczna, pasek sportowy",
        "visual": "Drobne rysy na kopercie, ekran bez uszkodzeń",
        "paid": True,
        "history": [
            (RepairStatus.NEW, (5, "13:15"), "Przyjęcie w serwisie"),
            (RepairStatus.IN_DIAGNOSTICS, (5, "14:00"), ""),
            (RepairStatus.QUOTE_SENT, (5, "15:00"), ""),
            (RepairStatus.QUOTE_ACCEPTED, (5, "16:20"), ""),
            (RepairStatus.IN_REPAIR, (3, "10:00"), ""),
            (RepairStatus.READY_FOR_PICKUP, (2, "12:30"), "Klient powiadomiony"),
            (RepairStatus.PICKED_UP, (1, "12:10"), "Odbiór osobisty, płatność gotówką"),
        ],
        "quote": {"status": QuoteStatus.ACCEPTED, "sent": (5, "15:00"), "decided": (5, "16:20"), "items": [
            (QuoteItemType.PART, "Bateria Apple Watch Series 9", "179.00", "0"),
            (QuoteItemType.LABOUR, "Wymiana baterii, uszczelka, test szczelności", "0", "110.00"),
        ]},
        "completed": (2, "12:00"), "ready": (2, "12:30"), "picked": (1, "12:10"), "final": "289.00",
    },
]

# Task: (repair index, title, priority, "HH:MM" due today, status)
TASKS = [
    (1, "Zamontuj baterię w Galaxy S24 — część dotarła", TaskPriority.URGENT, "12:00", TaskStatus.NEW),
    (3, "Przygotuj wycenę gniazda USB-C — Redmi Note 13", TaskPriority.IMPORTANT, "14:00", TaskStatus.IN_PROGRESS),
    (4, "Zadzwoń do Firma Demo z wynikiem diagnozy drukarki", TaskPriority.STANDARD, "16:00", TaskStatus.NEW),
]

# Notification: (repair index, type, priority, title, description, days_ago/time)
NOTIFICATIONS = [
    (1, "part_arrived", StaffNotification.IMPORTANT, "Część dotarła — zamontuj",
     "Bateria Samsung Galaxy S24 (EB-BS921ABY) jest na miejscu.", (0, "09:15")),
    (6, "client_message", StaffNotification.STANDARD, "Nowa wiadomość od klienta",
     "Paweł J. pyta o wycenę iPada 10. gen.", (0, "10:20")),
]


def _demo_client_email(key):
    return f"{DEMO_EMAIL_PREFIX}{key}{DEMO_EMAIL_DOMAIN}"


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------
class Command(BaseCommand):
    help = "Dane demo do zrzutów panelu pracownika (tylko staging/lokalnie). Bez --yes-staging: dry run."

    def add_arguments(self, parser):
        parser.add_argument("--yes-staging", action="store_true", help="Wykonaj zapis (bez tej flagi: dry run).")
        parser.add_argument("--clear", action="store_true", help="Tylko usuń dane demo.")

    # -- entry -------------------------------------------------------------
    def handle(self, *args, **opts):
        env = detect_environment(*current_db_info())
        self.stdout.write(f"Środowisko: {env} (baza: {connection.settings_dict.get('NAME')})")

        self._report_test_audit_records()
        existing = self._find_demo()
        self.stdout.write(
            f"Istniejące dane demo: {len(existing['repairs'])} napraw, {len(existing['clients'])} klientów, "
            f"użytkownik demo: {'tak' if existing['user'] else 'nie'}"
        )

        if not opts["yes_staging"]:
            self._print_plan(opts["clear"])
            self.stdout.write(self.style.WARNING("DRY RUN — nic nie zapisano. Dodaj --yes-staging, aby wykonać."))
            return

        with no_outbound_communication() as blocked:
            with transaction.atomic():
                removed = self._clear(existing)
                self.stdout.write(f"Usunięto poprzednie demo (obiekty razem z powiązanymi): {removed}")
                if opts["clear"]:
                    self.stdout.write(self.style.SUCCESS("Dane demo usunięte."))
                    return
                password = self._seed()
        if blocked:
            self.stdout.write(f"Zablokowane zadania Celery: {', '.join(blocked)}")
        self._print_summary(password)

    # -- discovery ---------------------------------------------------------
    def _registry(self):
        row = SystemSetting.objects.filter(key=REGISTRY_KEY).first()
        return row.value_json if row and isinstance(row.value_json, dict) else None

    def _find_demo(self):
        """Demo = both markers AND (if registry exists) listed in registry."""
        reg = self._registry()
        clients = Client.objects.filter(
            email__startswith=DEMO_EMAIL_PREFIX,
            email__endswith=DEMO_EMAIL_DOMAIN,
            internal_notes__startswith=DEMO_MARK,
        )
        repairs = RepairRequest.objects.filter(client__in=clients, internal_notes__startswith=DEMO_MARK)
        user = User.objects.filter(email=DEMO_USER_EMAIL, last_name="Demo").first()
        if reg is not None:
            clients = clients.filter(id__in=reg.get("clients", []))
            repairs = repairs.filter(id__in=reg.get("repairs", []))
            if user and str(user.id) not in reg.get("users", []):
                user = None
        return {
            "clients": list(clients.values_list("id", flat=True)),
            "repairs": list(repairs.values_list("id", flat=True)),
            "user": user,
        }

    def _report_test_audit_records(self):
        q = (
            Q(internal_notes__icontains=TEST_AUDIT_PHRASE)
            | Q(problem_description__icontains=TEST_AUDIT_PHRASE)
            | Q(client__first_name__icontains=TEST_AUDIT_PHRASE)
            | Q(client__last_name__icontains=TEST_AUDIT_PHRASE)
        )
        rows = list(RepairRequest.objects.filter(q).values_list("repair_number", "status")[:20])
        if rows:
            self.stdout.write(self.style.WARNING(
                f"Rekordy „{TEST_AUDIT_PHRASE}…” ({len(rows)}; seed_demo ich NIE rusza): "
                + ", ".join(f"{n} [{s}]" for n, s in rows)
            ))
        unassigned = RepairRequest.objects.filter(assigned_to__isnull=True).exclude(
            status__in=[RepairStatus.PICKED_UP, RepairStatus.DELIVERED, RepairStatus.SHIPPED,
                        RepairStatus.CANCELLED, RepairStatus.UNREPAIRABLE, RepairStatus.ABANDONED]
        ).exclude(internal_notes__startswith=DEMO_MARK).count()
        if unassigned:
            self.stdout.write(self.style.WARNING(
                f"Uwaga: w bazie jest już {unassigned} nieprzypisanych aktywnych napraw (nie-demo) — "
                "licznik „Nieprzypisane” pokaże więcej niż 1."
            ))

    # -- clear -------------------------------------------------------------
    def _clear(self, found):
        repair_ids, client_ids, user = found["repairs"], found["clients"], found["user"]
        counts = {}
        task_q = Q(related_repair_id__in=repair_ids)
        if user:
            task_q |= Q(assigned_to=user) | Q(created_by=user)
        counts["tasks"] = Task.objects.filter(task_q).delete()[0]
        # Repairs cascade: notes, history, assignments, quotes, part usages, notifications.
        counts["repairs"] = RepairRequest.objects.filter(id__in=repair_ids).delete()[0]
        counts["clients"] = Client.objects.filter(id__in=client_ids).delete()[0]  # cascades devices
        if user:
            counts["user"] = User.objects.filter(pk=user.pk).delete()[0]
        SystemSetting.objects.filter(key=REGISTRY_KEY).delete()
        return counts

    # -- seed --------------------------------------------------------------
    def _at(self, spec):
        days_ago, hhmm = spec
        h, m = (int(x) for x in hhmm.split(":"))
        day = timezone.localdate() - timedelta(days=days_ago)
        return timezone.make_aware(datetime.combine(day, time(h, m)))

    def _seed(self):
        today = timezone.localdate()
        password = secrets.token_urlsafe(12)
        reg = {"users": [], "clients": [], "repairs": []}

        user = User.objects.create_user(
            email=DEMO_USER_EMAIL, password=password, first_name="Serwisant", last_name="Demo",
            role=UserRole.STAFF, phone="+48 111 222 300",
        )
        if hasattr(user, "email_verified"):
            user.email_verified = True
            user.save(update_fields=["email_verified"])
        StaffProfile.objects.update_or_create(user=user, defaults={
            "position": "Serwisant — Rabka-Zdrój",
            "display_name": "Serwisant Demo",
            "login_alias": "demo.serwisant",
            "specialization": StaffSpecialization.GENERAL,
            "is_visible_in_rankings": False,
        })
        reg["users"].append(str(user.id))

        clients = {}
        for key, first, last, city, phone, business in CLIENTS:
            c = Client.objects.create(
                first_name=first, last_name=last, email=_demo_client_email(key), phone=phone, city=city,
                client_type=ClientType.BUSINESS if business else ClientType.INDIVIDUAL,
                company_name="Firma Demo Sp. z o.o." if business else "",
                contact_person="Jan Demo" if business else "",
                internal_notes=f"{DEMO_MARK} seed_demo — klient fikcyjny",
            )
            clients[key] = c
            reg["clients"].append(str(c.id))

        repairs = []
        for spec in REPAIRS:
            r = self._create_repair(spec, clients[spec["client"]], user, today)
            repairs.append(r)
            reg["repairs"].append(str(r.id))

        for idx, title, prio, hhmm, status in TASKS:
            t = Task.objects.create(
                title=title, created_by=user, assigned_to=user, status=status, priority=prio,
                due_date=self._at((0, hhmm)), related_repair=repairs[idx],
                description=f"Naprawa {repairs[idx].repair_number}",
            )
            Task.objects.filter(pk=t.pk).update(created_at=self._at((0, "08:00")))

        for idx, ntype, prio, title, desc, when in NOTIFICATIONS:
            n = StaffNotification.objects.create(
                user=user, notification_type=ntype, priority=prio, repair=repairs[idx],
                title=title, description=desc, status=StaffNotification.UNREAD,
                link=f"/staff/repairs/{repairs[idx].id}/",
            )
            StaffNotification.objects.filter(pk=n.pk).update(created_at=self._at(when))

        SystemSetting.objects.create(
            key=REGISTRY_KEY, category="demo", label="seed_demo — rejestr ID danych demo",
            description="Tworzone i usuwane przez `manage.py seed_demo`. Nie edytować.",
            value_type="json", value_json=reg, is_readonly=True,
        )
        return password

    def _create_repair(self, spec, client, user, today):
        brand = Brand.objects.filter(name__iexact=spec["brand"]).first()  # never create shared brands
        device = Device.objects.create(
            client=client, category=spec["category"], brand=brand, model_name=spec["model"],
            manual_brand="" if brand else spec["brand"], manual_model="" if brand else spec["model"],
            color=spec.get("color", ""), condition_on_arrival=spec["visual"],
            accessories_included=spec["accessories"],
        )
        accepted = self._at(spec["accepted"])
        assigned = None if spec.get("unassigned") else user
        status = spec["status"]
        quote_spec = spec.get("quote")
        quote_total = sum(
            (Decimal(p) + Decimal(lab)) for _, _, p, lab in (quote_spec["items"] if quote_spec else [])
        ) or None
        paid = spec.get("paid", False)

        r = RepairRequest.objects.create(
            client=client, device=device, assigned_to=assigned, status=status,
            priority=RepairPriority.URGENT if spec.get("urgent") else RepairPriority.NORMAL,
            is_urgent=bool(spec.get("urgent")),
            problem_description=spec["problem"],
            internal_notes=f"{DEMO_MARK} {spec['internal']}",
            visual_condition_description=spec["visual"],
            client_notes=f"Akcesoria przy przyjęciu: {spec['accessories']}",
            device_turns_on=True,
            source=spec.get("source", RepairSource.IN_PERSON),
            accepted_at=accepted,
            estimated_completion_date=(today + timedelta(days=spec["due"])) if spec.get("due") is not None else None,
            estimated_cost=quote_total,
            final_cost=Decimal(spec["final"]) if spec.get("final") else None,
            payment_status=PaymentStatus.PAID if paid else PaymentStatus.PENDING,
            requires_data_backup=bool(spec.get("backup")),
            data_backup_completed=bool(spec.get("backup")),
            completed_at=self._at(spec["completed"]) if spec.get("completed") else None,
            ready_for_pickup_at=self._at(spec["ready"]) if spec.get("ready") else None,
            picked_up_at=self._at(spec["picked"]) if spec.get("picked") else None,
            quote_sent_at=self._at(quote_spec["sent"]) if quote_spec else None,
            created_by=user,
        )
        RepairRequest.objects.filter(pk=r.pk).update(created_at=accepted)

        if assigned:
            RepairAssignment.objects.create(
                repair=r, assigned_to=user, assigned_by=user, assigned_at=accepted, is_current=True,
            )

        prev = None
        for new_status, when, note in spec["history"]:
            h = RepairStatusHistory.objects.create(
                repair=r, old_status=prev, new_status=new_status, changed_by=user, notes=note,
            )
            RepairStatusHistory.objects.filter(pk=h.pk).update(created_at=self._at(when))
            prev = new_status

        if quote_spec:
            q = Quote.objects.create(
                repair=r, status=quote_spec["status"], sent_at=self._at(quote_spec["sent"]),
                valid_until=today + timedelta(days=14), created_by=user,
            )
            for itype, desc, parts, labour in quote_spec["items"]:
                QuoteItem.objects.create(
                    quote=q, item_type=itype, description=desc,
                    parts_price=Decimal(parts), labour_price=Decimal(labour),
                )
            if quote_spec.get("decided"):
                QuoteDecision.objects.create(
                    quote=q, decision="accepted", decided_at=self._at(quote_spec["decided"]),
                )

        part = spec.get("part")
        if part:
            PartUsage.objects.create(
                repair=r, custom_part_name=part["name"], quantity=Decimal("1"),
                purchase_cost=Decimal(part["cost"]), unit_price_used=Decimal(part["price"]),
                added_by=user, usage_status=PartUsageStatus.ARRIVED, order_status=PartOrderStatus.ARRIVED,
                ordered_at=self._at(part["ordered"]), ordered_by=user, expected_arrival_date=today,
                notes="Dotarła dziś — zamontuj",
            )

        last_client = last_staff = None
        for origin, when, text in spec.get("messages", []):
            n = RepairNote.objects.create(
                repair=r, author=user if origin == RepairNoteThreadOrigin.STAFF else None,
                note=text, is_internal=False, note_type=RepairNote.NOTE_TYPE_CLIENT_CONTACT,
                thread_origin=origin,
            )
            ts = self._at(when)
            RepairNote.objects.filter(pk=n.pk).update(created_at=ts)
            if origin == RepairNoteThreadOrigin.CLIENT:
                last_client = ts
            else:
                last_staff = ts
        if last_client or last_staff:
            RepairRequest.objects.filter(pk=r.pk).update(
                last_client_message_at=last_client, last_staff_reply_at=last_staff,
                requires_attention=bool(last_client and (not last_staff or last_client > last_staff)),
            )

        RepairNote.objects.create(
            repair=r, author=user, note=spec["internal"], is_internal=True,
            note_type=RepairNote.NOTE_TYPE_INTERNAL, thread_origin=RepairNoteThreadOrigin.STAFF,
        )
        return r

    # -- output ------------------------------------------------------------
    def _print_plan(self, clear):
        if clear:
            self.stdout.write("Plan (--clear): usunąć tylko dane demo wymienione wyżej.")
            return
        self.stdout.write("Plan: usunąć poprzednie demo, potem utworzyć:")
        self.stdout.write(f"  • użytkownik {DEMO_USER_EMAIL} (Serwisant Demo, staff, Rabka-Zdrój)")
        self.stdout.write(f"  • {len(CLIENTS)} klientów fikcyjnych ({DEMO_EMAIL_PREFIX}*{DEMO_EMAIL_DOMAIN})")
        for i, s in enumerate(REPAIRS, 1):
            who = "NIEPRZYPISANA" if s.get("unassigned") else "Serwisant Demo"
            self.stdout.write(f"  {i:>2}. {s['brand']} {s['model']} — {s['status']} — {who}")
        self.stdout.write(f"  • {len(TASKS)} zadania na dziś, {len(NOTIFICATIONS)} nieprzeczytane powiadomienia")

    def _print_summary(self, password):
        from apps.repairs.selectors.staff_dashboard import (
            staff_completed_pickups_count,
            staff_in_repair_kpi_count,
            staff_my_active_repairs_count,
            staff_repairs_ready_for_pickup,
            staff_repairs_today_to_contact,
        )
        user = User.objects.get(email=DEMO_USER_EMAIL)
        demo = RepairRequest.objects.filter(internal_notes__startswith=DEMO_MARK, client__email__endswith=DEMO_EMAIL_DOMAIN)
        self.stdout.write(self.style.SUCCESS("Dane demo wgrane."))
        self.stdout.write("Naprawy wg statusu:")
        for st in sorted(set(demo.values_list("status", flat=True))):
            self.stdout.write(f"  {st}: {demo.filter(status=st).count()}")
        self.stdout.write("Liczniki dashboardu (Serwisant Demo):")
        self.stdout.write(f"  Aktywnych: {staff_my_active_repairs_count(user.id)}")
        self.stdout.write(f"  W trakcie Naprawy: {staff_in_repair_kpi_count(user.id)}")
        self.stdout.write(f"  Gotowe do Odbioru: {staff_repairs_ready_for_pickup(user.id).count()}")
        self.stdout.write(f"  Wiadomości (wyceny wysłane): {staff_repairs_today_to_contact(user.id).count()}")
        for scope, label in (("today", "Dziś"), ("week", "Ten tydzień"), ("month", "Ten miesiąc")):
            self.stdout.write(f"  Zakończonych ({label}): {staff_completed_pickups_count(user.id, scope)}")
        self.stdout.write(f"  Nieprzypisane (demo): {demo.filter(assigned_to__isnull=True).count()}")
        self.stdout.write(self.style.WARNING(
            f"Logowanie do /panel: {DEMO_USER_EMAIL}  hasło: {password}  (pokazane tylko teraz)"
        ))
