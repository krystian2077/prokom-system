"""
Preview of every e-mail sent by the backend (PRO-KOM Tech layout), without sending anything.

Renders each e-mail through the real backend code (send functions with stubbed transport and DB log)
into tmp/maile/<name>.html, then (unless --bez-zrzutow) takes Playwright screenshots
at 375 and 680 px, light and dark scheme, into tmp/maile/png/.

Run with the backend venv (Windows example):
  D:/PRO-KOM/repos/prokom-system/backend/.venv/Scripts/python scripts/tech/maile-podglad.py
Images point to https://prokomserwis.pl/tech/mail/…; in the preview they are swapped
for the local files from frontend/public/tech/mail/.
"""
import os
import subprocess
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
OUT = ROOT / "tmp" / "maile"

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from django.template.loader import render_to_string  # noqa: E402

import apps.communications.models as comm_models  # noqa: E402
from apps.communications.services import send as send_service  # noqa: E402
from apps.communications.services import staff_notifications  # noqa: E402
from apps.communications.views.inquiry_views import _build_inquiry_html  # noqa: E402

settings.FRONTEND_BASE_URL = "https://prokomserwis.pl"
captured = {}


def _capture_html(to_email, subject, body_plain, html_content, fail_silently=True):
    captured["subject"] = subject
    captured["html"] = html_content
    captured["plain"] = body_plain
    return 1


class _Log:
    class objects:  # noqa: N801 — mimics the Django manager
        @staticmethod
        def create(**kwargs):
            return SimpleNamespace(**kwargs)


send_service.send_email_html = _capture_html
comm_models.CommunicationLog = _Log


# ---------- sample data ----------
class Client:
    email = "jan.kowalski@example.com"
    phone = "+48 600 700 812"

    @staticmethod
    def get_full_name():
        return "Jan Kowalski"


class Device:
    @staticmethod
    def get_device_name():
        return "Apple iPhone 13 Pro"


class _Interests:
    @staticmethod
    def all():
        return SimpleNamespace(order_by=lambda *a: [])


def make_repair(**over):
    data = dict(
        id=1287,
        repair_number="R-2026-01287",
        client=Client(),
        device=Device(),
        problem_description="Pęknięta szybka i nie działa dotyk w dolnej części ekranu. Telefon spadł na kostkę brukową.",
        delivery_method="in_person",
        return_method="in_person",
        claim_token="abc123",
        claim_token_expires_at=datetime(2099, 1, 1, tzinfo=django.utils.timezone.get_current_timezone()),
        hammer_glass_interest="yes",
        accessory_interests=None,
        client_notes="Proszę o kontakt po 15:00.",
        device_turns_on=True,
        visual_condition_description="",
        estimated_cost=None,
        estimated_completion_date=None,
        ready_for_pickup_at=datetime(2026, 11, 16, 14, 25, tzinfo=django.utils.timezone.get_current_timezone()),
        return_address=None,
        service_tracking_number="",
        service_courier="",
    )
    data.update(over)
    labels = {"in_person": "Osobiście w serwisie", "courier": "Kurier", "parcel_locker": "Paczkomat"}
    ret = {"in_person": "Odbiór osobisty", "courier": "Kurier", "parcel_locker": "Paczkomat"}
    r = SimpleNamespace(**data)
    r.get_delivery_method_display = lambda: labels[r.delivery_method]
    r.get_return_method_display = lambda: ret[r.return_method]
    r.get_estimated_duration_display = lambda: ""
    return r


def write(name, html, plain=None):
    OUT.mkdir(parents=True, exist_ok=True)
    local = (ROOT / "frontend" / "public" / "tech" / "mail").as_uri() + "/"
    (OUT / f"{name}.html").write_text(html.replace("https://prokomserwis.pl/tech/mail/", local), encoding="utf-8")
    if plain:
        (OUT / f"{name}.txt").write_text(plain, encoding="utf-8")
    print(f"  {name}.html  ({captured.get('subject', '-')})")
    captured.clear()


def main():
    import django.utils.timezone  # noqa: F401

    tz = django.utils.timezone.get_current_timezone()
    print("Renderuję maile do", OUT)
    for old in OUT.glob("*.html"):
        old.unlink()

    addr = SimpleNamespace(street="ul. Kwiatowa", house_number="12/4", postal_code="30-001", city="Kraków")
    note = "Proszę o kontakt po 15:00."
    # Point lines exactly as frontend/lib/tech/contract.ts (pointLines + buildAdditionalNotes) writes them.
    variants = {
        "rabka-rabka": dict(client_notes=f"Punkt przyjęcia: Rabka-Zdrój\n\n{note}"),
        "zakopane-zakopane": dict(client_notes="Punkt przyjęcia: Zakopane"),
        "zakopane-odbior-rabka": dict(client_notes=f"Punkt przyjęcia: Zakopane\nPunkt odbioru: Rabka-Zdrój\n\n{note}"),
        "rabka-odbior-zakopane": dict(client_notes="Punkt przyjęcia: Rabka-Zdrój\nPunkt odbioru: Zakopane"),
        "kurier-zwrot-kurier": dict(delivery_method="courier", return_method="courier", return_address=addr,
                                    client_notes=f"Wysyłka na adres: Rabka-Zdrój\n\n{note}"),
        "kurier-odbior-rabka": dict(delivery_method="courier", client_notes="Wysyłka na adres: Rabka-Zdrój"),
        "kurier-odbior-zakopane": dict(delivery_method="courier", client_notes="Wysyłka na adres: Rabka-Zdrój\nPunkt odbioru: Zakopane"),
        "bez-punktu": dict(client_notes=note),
    }

    # 1. Submission confirmation — online form, whole matrix
    for i, (name, over) in enumerate(variants.items(), start=1):
        send_service.send_repair_submission_confirmation(make_repair(**over), fail_silently=False)
        write(f"1{i}-zgloszenie-{name}", captured["html"], captured["plain"])

    # 2. Intake at the counter (stationary): with points (pickup elsewhere) and without
    stationary = dict(
        estimated_cost=Decimal("349.00"),
        estimated_completion_date=date(2026, 11, 18),
        visual_condition_description="Rysy na ramce, pęknięta szybka.",
        claim_token=None,
    )
    send_service.send_repair_submission_confirmation(
        make_repair(**stationary, client_notes="Punkt przyjęcia: Zakopane\nPunkt odbioru: Rabka-Zdrój"),
        fail_silently=False, intake_stationary=True,
    )
    write("21-stacjonarne-zakopane-odbior-rabka", captured["html"], captured["plain"])
    send_service.send_repair_submission_confirmation(make_repair(**stationary, client_notes=""), fail_silently=False, intake_stationary=True)
    write("22-stacjonarne-bez-punktu", captured["html"], captured["plain"])

    # 3. Ready for pickup / sending back
    send_service.send_repair_completion_thank_you_email(make_repair(**variants["rabka-rabka"]))
    write("31-gotowe-odbior-rabka", captured["html"], captured["plain"])
    send_service.send_repair_completion_thank_you_email(make_repair(**variants["rabka-odbior-zakopane"]))
    write("32-gotowe-odbior-zakopane", captured["html"], captured["plain"])
    send_service.send_repair_completion_thank_you_email(make_repair(**variants["kurier-zwrot-kurier"]))
    write("33-gotowe-kurier", captured["html"], captured["plain"])
    send_service.send_repair_completion_thank_you_email(
        make_repair(**variants["kurier-zwrot-kurier"], service_tracking_number="6200123456789", service_courier="InPost")
    )
    write("34-gotowe-kurier-z-numerem", captured["html"], captured["plain"])
    send_service.send_repair_completion_thank_you_email(make_repair(client_notes=""))
    write("35-gotowe-bez-punktu", captured["html"], captured["plain"])

    # 4. Quote — with costs, update, and without items
    items = [
        SimpleNamespace(description="Wymiana wyświetlacza OLED", quantity=1, parts_price=Decimal("520.00"),
                        labour_price=Decimal("80.00"), total=Decimal("600.00"), get_part_origin_display=lambda: "Oryginał"),
        SimpleNamespace(description="Folia Hammer Glass", quantity=1, parts_price=Decimal("0"),
                        labour_price=Decimal("0"), total=Decimal("0"), get_part_origin_display=lambda: ""),
    ]

    def quote(rows, total):
        return SimpleNamespace(
            version=2,
            items=SimpleNamespace(all=lambda: SimpleNamespace(order_by=lambda *a: rows)),
            total_amount=total,
            valid_until=date(2026, 11, 30),
            sent_at=datetime(2026, 11, 16, 10, 5, tzinfo=tz),
        )

    send_service.send_quote_summary_email_to_client(make_repair(), quote(items, Decimal("600.00")), None)
    write("41-wycena", captured["html"], captured["plain"])
    send_service.send_quote_summary_email_to_client(make_repair(), quote(items, Decimal("600.00")), None, is_resend=True)
    write("42-wycena-aktualizacja", captured["html"], captured["plain"])
    send_service.send_quote_summary_email_to_client(make_repair(), quote([], Decimal("0")), None)
    write("43-wycena-bez-pozycji", captured["html"], captured["plain"])

    # 5. Account: verification code, password reset (same render calls as the backend)
    write("51-kod-weryfikacyjny", render_to_string("emails/verification_code.html", {"code": "482913"}))
    write("52-reset-hasla", render_to_string(
        "emails/password_reset.html",
        {"reset_url": "https://prokomserwis.pl/client/reset-password?token=6f1c0b2e9a7d4c3b8e5f"},
    ))

    # 6. Internal: new online repair (3 variants)
    sent = {}

    class _Msg:
        def __init__(self, subject, body, from_email, to):
            sent["subject"] = subject
            sent["plain"] = body

        def attach_alternative(self, html, mime):
            sent["html"] = html

        def send(self, fail_silently=False):
            return 1

    staff_notifications.EmailMultiAlternatives = _Msg
    settings.STAFF_NOTIFICATION_EMAILS = ["serwis@example.com"]
    for i, name in enumerate(["zakopane-odbior-rabka", "kurier-zwrot-kurier", "bez-punktu"], start=1):
        staff_notifications.send_new_repair_staff_notification(make_repair(**variants[name]))
        captured["subject"] = sent["subject"]
        write(f"6{i}-serwis-{name}", sent["html"], sent["plain"])

    # 7. Internal: contact form (with an injection attempt — must show as text)
    write("71-serwis-zapytanie", _build_inquiry_html(
        "Anna Nowak <b>test</b>", "+48 501 234 567", "anna.nowak@example.com", "Naprawa laptopa",
        "Dzień dobry,\nczy naprawiacie zawiasy w laptopie Lenovo IdeaPad 5?\n<a href=\"https://zly.example\">kliknij</a>",
        "16.11.2026, 12:40",
    ))

    if "--bez-zrzutow" not in sys.argv:
        subprocess.run(["node", str(ROOT / "scripts" / "tech" / "maile-zrzuty.mjs"), str(OUT)], check=True)


if __name__ == "__main__":
    main()
