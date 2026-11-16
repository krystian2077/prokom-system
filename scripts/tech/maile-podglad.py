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
    )
    data.update(over)
    labels = {"in_person": "Osobiście w serwisie", "courier": "Kurier", "parcel_locker": "Paczkomat"}
    ret = {"in_person": "Odbiór osobisty", "courier": "Kurier", "parcel_locker": "Paczkomat"}
    r = SimpleNamespace(**data)
    r.get_delivery_method_display = lambda: labels[r.delivery_method]
    r.get_return_method_display = lambda: ret[r.return_method]
    r.get_estimated_duration_display = lambda: ""
    return r


def write(name, html):
    OUT.mkdir(parents=True, exist_ok=True)
    local = (ROOT / "frontend" / "public" / "tech" / "mail").as_uri() + "/"
    (OUT / f"{name}.html").write_text(html.replace("https://prokomserwis.pl/tech/mail/", local), encoding="utf-8")
    print(f"  {name}.html  ({captured.get('subject', '-')})")
    captured.clear()


def main():
    import django.utils.timezone  # noqa: F401

    print("Renderuję maile do", OUT)

    # 1. Submission confirmation — online form, drop-off in a salon
    send_service.send_repair_submission_confirmation(make_repair(), fail_silently=False)
    write("01-zgloszenie-online-salon", captured["html"])

    # 2. Submission confirmation — online form, courier
    send_service.send_repair_submission_confirmation(
        make_repair(delivery_method="courier", return_method="courier", hammer_glass_interest=None, client_notes=""),
        fail_silently=False,
    )
    write("02-zgloszenie-online-kurier", captured["html"])

    # 3. Intake at the counter (stationary)
    send_service.send_repair_submission_confirmation(
        make_repair(
            estimated_cost=Decimal("349.00"),
            estimated_completion_date=date(2026, 11, 18),
            visual_condition_description="Rysy na ramce, pęknięta szybka.",
            claim_token=None,
        ),
        fail_silently=False,
        intake_stationary=True,
    )
    write("03-przyjecie-stacjonarne", captured["html"])

    # 4. Quote
    items = [
        SimpleNamespace(description="Wymiana wyświetlacza OLED", quantity=1, parts_price=Decimal("520.00"),
                        labour_price=Decimal("80.00"), total=Decimal("600.00"), get_part_origin_display=lambda: "Oryginał"),
        SimpleNamespace(description="Folia Hammer Glass", quantity=1, parts_price=Decimal("0"),
                        labour_price=Decimal("0"), total=Decimal("0"), get_part_origin_display=lambda: ""),
    ]
    quote = SimpleNamespace(
        version=2,
        items=SimpleNamespace(all=lambda: SimpleNamespace(order_by=lambda *a: items)),
        total_amount=Decimal("600.00"),
        valid_until=date(2026, 11, 30),
        sent_at=datetime(2026, 11, 16, 10, 5, tzinfo=django.utils.timezone.get_current_timezone()),
    )
    send_service.send_quote_summary_email_to_client(make_repair(), quote, None, is_resend=False)
    write("04-wycena", captured["html"])
    send_service.send_quote_summary_email_to_client(make_repair(), quote, None, is_resend=True)
    write("05-wycena-aktualizacja", captured["html"])

    # 6. Thank you after the repair
    send_service.send_repair_completion_thank_you_email(make_repair())
    write("06-naprawa-zakonczona", captured["html"])

    # 7–8. Account: verification code, password reset (same render calls as the backend)
    write("07-kod-weryfikacyjny", render_to_string("emails/verification_code.html", {"code": "482913"}))
    write("08-reset-hasla", render_to_string(
        "emails/password_reset.html",
        {"reset_url": "https://prokomserwis.pl/client/reset-password?token=6f1c0b2e9a7d4c3b8e5f"},
    ))

    # 9. Internal: new online repair
    sent = {}

    class _Msg:
        def __init__(self, subject, body, from_email, to):
            sent["subject"] = subject

        def attach_alternative(self, html, mime):
            sent["html"] = html

        def send(self, fail_silently=False):
            return 1

    staff_notifications.EmailMultiAlternatives = _Msg
    settings.STAFF_NOTIFICATION_EMAILS = ["serwis@example.com"]
    staff_notifications.send_new_repair_staff_notification(make_repair(delivery_method="courier"))
    captured["subject"] = sent["subject"]
    write("09-serwis-nowe-zgloszenie", sent["html"])

    # 10. Internal: contact form (with an injection attempt — must show as text)
    write("10-serwis-zapytanie", _build_inquiry_html(
        "Anna Nowak <b>test</b>", "+48 501 234 567", "anna.nowak@example.com", "Naprawa laptopa",
        "Dzień dobry,\nczy naprawiacie zawiasy w laptopie Lenovo IdeaPad 5?\n<a href=\"https://zly.example\">kliknij</a>",
        "16.11.2026, 12:40",
    ))

    if "--bez-zrzutow" not in sys.argv:
        subprocess.run(["node", str(ROOT / "scripts" / "tech" / "maile-zrzuty.mjs"), str(OUT)], check=True)


if __name__ == "__main__":
    main()
