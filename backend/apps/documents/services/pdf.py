"""
Generowanie PDF: protokół przyjęcia A4 — potwierdzenie przyjęcia sprzętu (premium, białe tło).
"""
from __future__ import annotations

import io
from pathlib import Path
from decimal import Decimal

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from apps.common.enums import DeviceCategory

_FONT_REGISTERED = False

# Czcionki DejaVu (PL) — katalog apps/documents/fonts/
_FONTS_DIR = Path(__file__).resolve().parent.parent / "fonts"


def _ensure_fonts() -> None:
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return
    regular = _FONTS_DIR / "DejaVuSans.ttf"
    bold = _FONTS_DIR / "DejaVuSans-Bold.ttf"
    if regular.is_file() and bold.is_file():
        pdfmetrics.registerFont(TTFont("DejaVuSans", str(regular)))
        pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", str(bold)))
        _FONT_REGISTERED = True
    else:
        raise FileNotFoundError(
            f"Brak czcionek DejaVu w {_FONTS_DIR}. Pobierz DejaVuSans.ttf i DejaVuSans-Bold.ttf."
        )


def _esc(s: str) -> str:
    if s is None:
        return ""
    t = str(s)
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _money_pl(value) -> str:
    if value is None:
        return "—"
    try:
        d = value if isinstance(value, Decimal) else Decimal(str(value))
    except Exception:
        return str(value)
    integral, frac = f"{d:.2f}".split(".")
    try:
        integral_fmt = f"{int(integral):,}".replace(",", " ")
    except ValueError:
        integral_fmt = integral
    return f"{integral_fmt},{frac} zł"


def _category_label(code: str) -> str:
    try:
        return str(DeviceCategory(code).label)
    except Exception:
        return code or "—"


def _hammer_glass_pdf_label(hg: str) -> str:
    if hg == "yes":
        return "Tak — zainteresowanie folią Hammer Glass / szkłem hartowanym (wycena przy naprawie)"
    if hg == "no":
        return "Nie — brak zainteresowania w tej chwili"
    if hg == "ask_later":
        return "Zapytam później"
    if hg == "free_with_quote":
        return "Gratis przy wycenie"
    return hg or "—"


def _duration_text(repair) -> str:
    lo = repair.estimated_duration_days_min
    hi = repair.estimated_duration_days_max
    if lo is None and hi is None:
        return "—"
    if lo is not None and hi is not None and lo != hi:
        return f"{lo}–{hi} dni roboczych"
    v = lo if lo is not None else hi
    return f"{v} dni roboczych"


def _client_display_name(client) -> str:
    from apps.common.enums import ClientType

    if getattr(client, "client_type", None) == ClientType.BUSINESS and getattr(client, "company_name", "").strip():
        base = client.company_name.strip()
        person = client.contact_person.strip() if client.contact_person else ""
        if person:
            return f"{base} — {person}"
        return base
    return client.get_full_name() or "—"


def _client_email_for_print(client) -> str | None:
    """Adres do wydruku — pomija techniczny placeholder (brak e-maila przy przyjęciu)."""
    raw = (getattr(client, "email", None) or "").strip()
    if not raw:
        return None
    lower = raw.lower()
    if lower.endswith("@prokom.local"):
        return None
    return raw


def _split_intake_scope_and_problem(text: str) -> tuple[str, str]:
    """
    Intake składa: pierwszy akapit „Zakres usługi: …”, potem \\n\\n i opis.
    Zwraca (zakres, opis) — jeśli brak prefiksu, całość w opisie, zakres „—”.
    """
    t = (text or "").strip()
    if not t:
        return ("—", "—")
    prefix = "Zakres usługi:"
    if not t.startswith(prefix):
        return ("—", t)
    rest = t[len(prefix) :].lstrip()
    if "\n\n" in rest:
        first, second = rest.split("\n\n", 1)
        scope = first.strip() or "—"
        problem = second.strip() or "—"
        return (scope, problem)
    line = rest.split("\n", 1)
    scope = line[0].strip() or "—"
    problem = line[1].strip() if len(line) > 1 else "—"
    return (scope, problem)


def _build_styles():
    _ensure_fonts()
    base = getSampleStyleSheet()
    accent = colors.HexColor("#c41e1e")
    ink = colors.HexColor("#141414")
    muted = colors.HexColor("#4a4a4a")

    styles = {
        "title": ParagraphStyle(
            name="Title",
            parent=base["Normal"],
            fontName="DejaVuSans-Bold",
            fontSize=20,
            leading=26,
            textColor=ink,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "subtitle": ParagraphStyle(
            name="Sub",
            parent=base["Normal"],
            fontName="DejaVuSans",
            fontSize=11,
            leading=15,
            textColor=muted,
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "h2": ParagraphStyle(
            name="H2",
            parent=base["Normal"],
            fontName="DejaVuSans-Bold",
            fontSize=13,
            leading=17,
            textColor=ink,
            spaceBefore=14,
            spaceAfter=8,
        ),
        "body": ParagraphStyle(
            name="Body",
            parent=base["Normal"],
            fontName="DejaVuSans",
            fontSize=10.5,
            leading=15,
            textColor=ink,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "small": ParagraphStyle(
            name="Small",
            parent=base["Normal"],
            fontName="DejaVuSans",
            fontSize=9,
            leading=12,
            textColor=muted,
            alignment=TA_LEFT,
        ),
        "ref_box": ParagraphStyle(
            name="RefBox",
            parent=base["Normal"],
            fontName="DejaVuSans-Bold",
            fontSize=18,
            leading=22,
            textColor=accent,
            alignment=TA_CENTER,
        ),
        "ref_label": ParagraphStyle(
            name="RefLabel",
            parent=base["Normal"],
            fontName="DejaVuSans-Bold",
            fontSize=11,
            leading=14,
            textColor=ink,
            alignment=TA_LEFT,
            spaceAfter=4,
        ),
        "contact": ParagraphStyle(
            name="Contact",
            parent=base["Normal"],
            fontName="DejaVuSans",
            fontSize=10.5,
            leading=14,
            textColor=ink,
            alignment=TA_LEFT,
        ),
    }
    return styles


def _kv_rows(rows: list[tuple[str, str]], col_widths, styles: dict) -> Table:
    body = styles["body"]
    data = [[Paragraph(f"<b>{_esc(a)}</b>", body), Paragraph(_esc(b), body)] for a, b in rows]
    t = Table(data, colWidths=col_widths)
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LINEABOVE", (0, 0), (-1, 0), 0.25, colors.HexColor("#e8e8e8")),
                ("LINEBELOW", (0, -1), (-1, -1), 0.25, colors.HexColor("#e8e8e8")),
                ("LINEAFTER", (0, 0), (0, -1), 0.25, colors.HexColor("#eeeeee")),
            ]
        )
    )
    return t


def _page_frame(canvas, doc):
    """Nagłówek (pas brandowy) i stopka na każdej stronie."""
    _ensure_fonts()
    w, h = A4
    canvas.saveState()
    accent = colors.HexColor("#c41e1e")
    canvas.setFillColor(accent)
    canvas.rect(0, h - 4 * mm, w, 4 * mm, fill=1, stroke=0)
    canvas.setStrokeColor(colors.HexColor("#e0e0e0"))
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, w - 18 * mm, 14 * mm)
    canvas.setFont("DejaVuSans", 8)
    canvas.setFillColor(colors.HexColor("#6a6a6a"))
    name = getattr(settings, "SERWIS_PRINT_COMPANY_NAME", "PRO-KOM")
    canvas.drawCentredString(
        w / 2,
        9 * mm,
        f"{name}  ·  dokument informacyjny  ·  wygenerowano elektronicznie",
    )
    canvas.restoreState()


def build_acceptance_protocol_pdf(repair, request=None):
    """
    PDF potwierdzenia przyjęcia — A4, białe tło, pełne dane + instrukcja panelu klienta.
    repair — RepairRequest (select_related client, device).
    """
    styles = _build_styles()
    client = repair.client
    device = repair.device

    base_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    reg_url = f"{base_url}/client/rejestracja"
    login_url = f"{base_url}/client/login"
    dashboard_url = f"{base_url}/client/dashboard"

    phone = (client.phone or "").strip()
    email_for_print = _client_email_for_print(client)

    company = getattr(settings, "SERWIS_PRINT_COMPANY_NAME", "PRO-KOM Serwis")
    tagline = getattr(settings, "SERWIS_PRINT_TAGLINE", "")
    tel = getattr(settings, "SERWIS_PRINT_PHONE", "")
    em = getattr(settings, "SERWIS_PRINT_EMAIL", "")
    addr = getattr(settings, "SERWIS_PRINT_ADDRESS", "")
    hours = getattr(settings, "SERWIS_PRINT_HOURS", "")
    www = getattr(settings, "SERWIS_PRINT_WEBSITE", "")

    accepted = repair.accepted_at or repair.created_at
    accepted_s = accepted.strftime("%d.%m.%Y %H:%M") if accepted else "—"

    device_lines = [
        ("Urządzenie", device.get_device_name()),
        ("Kategoria", _category_label(device.category)),
    ]
    if getattr(device, "color", None) and str(device.color).strip():
        device_lines.append(("Kolor", str(device.color).strip()))
    if device.imei and str(device.imei).strip():
        device_lines.append(("IMEI / identyfikator", str(device.imei).strip()))
    if device.serial_number and str(device.serial_number).strip():
        device_lines.append(("Numer seryjny", str(device.serial_number).strip()))
    acc = (device.accessories_included or "").strip()
    if acc:
        device_lines.append(("Akcesoria", acc))
    vis = (repair.visual_condition_description or device.condition_on_arrival or "").strip()
    if vis:
        device_lines.append(("Stan wizualny / uwagi", vis[:500]))

    repair_rows = [
        ("Numer zgłoszenia (referencyjny)", repair.repair_number),
        ("Data przyjęcia", accepted_s),
        ("Status", repair.get_status_display()),
        ("Priorytet", repair.get_priority_display()),
        ("Sposób dostarczenia", repair.get_delivery_method_display()),
        ("Sposób zwrotu", repair.get_return_method_display()),
    ]
    hg = getattr(repair, "hammer_glass_interest", None)
    if hg:
        repair_rows.append(
            ("Folia Hammer Glass / szkło hartowane", _hammer_glass_pdf_label(hg)),
        )
    if repair.estimated_completion_date:
        repair_rows.append(("Szacowana data zakończenia", repair.estimated_completion_date.strftime("%d.%m.%Y")))
    repair_rows.append(("Szacowany czas realizacji", _duration_text(repair)))
    repair_rows.append(("Szacunkowy koszt", _money_pl(repair.estimated_cost)))

    client_rows: list[tuple[str, str]] = [
        ("Klient", _client_display_name(client)),
        ("Telefon", phone or "—"),
    ]
    if email_for_print:
        client_rows.append(("E-mail", email_for_print))

    scope_text, problem_text = _split_intake_scope_and_problem(repair.problem_description or "")

    story = []

    story.append(Paragraph(_esc(company), styles["title"]))
    if tagline:
        story.append(Paragraph(_esc(tagline), styles["subtitle"]))
    story.append(Paragraph("Potwierdzenie przyjęcia sprzętu do serwisu", styles["subtitle"]))

    ref_block = Table(
        [[Paragraph(_esc(repair.repair_number), styles["ref_box"])]],
        colWidths=[174 * mm],
    )
    ref_block.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f5f5f5")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cfcfcf")),
                ("LINEBEFORE", (0, 0), (0, 0), 5, colors.HexColor("#c41e1e")),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ]
        )
    )
    story.append(
        KeepTogether(
            [
                Paragraph("Numer przyjęcia — zachowaj do odbioru", styles["ref_label"]),
                Spacer(1, 4),
                ref_block,
            ]
        )
    )
    story.append(Spacer(1, 10))

    story.append(Paragraph("Dane zgłoszenia", styles["h2"]))
    story.append(_kv_rows(repair_rows, (52 * mm, 122 * mm), styles))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Dane klienta", styles["h2"]))
    story.append(_kv_rows(client_rows, (52 * mm, 122 * mm), styles))

    story.append(Paragraph("Urządzenie", styles["h2"]))
    story.append(_kv_rows(device_lines, (52 * mm, 122 * mm), styles))

    story.append(Paragraph("Zakres naprawy", styles["h2"]))
    story.append(Paragraph(_esc(scope_text), styles["body"]))
    story.append(Paragraph("Opis problemu", styles["h2"]))
    story.append(Paragraph(_esc(problem_text), styles["body"]))

    story.append(Paragraph("Jak śledzić naprawę w panelu klienta", styles["h2"]))
    panel_txt = (
        f"Pełne śledzenie statusu, historii i wiadomości jest dostępne <b>po założeniu konta</b> i zalogowaniu się "
        f"w panelu klienta — nie ma osobnej ścieżki „śledzenia bez konta”.<br/><br/>"
        f"<b>1.</b> Wejdź na stronę <b>{_esc(www)}</b> i załóż konto (rejestracja): "
        f"<font color='#0d47a1'><u>{_esc(reg_url)}</u></font>.<br/><br/>"
    )
    if email_for_print:
        panel_txt += (
            f"<b>2.</b> Przy rejestracji podaj <b>ten sam adres e-mail</b>, który widnieje powyżej przy danych klienta — "
            f"wtedy to zgłoszenie powiąże się automatycznie z Twoim kontem.<br/><br/>"
            f"<b>3.</b> Zaloguj się: <font color='#0d47a1'><u>{_esc(login_url)}</u></font>, następnie otwórz "
            f"<font color='#0d47a1'><u>{_esc(dashboard_url)}</u></font>."
        )
    else:
        panel_txt += (
            f"<b>2.</b> Nie podano adresu e-mail przy przyjęciu stacjonarnym — załóż konto na dowolny adres e-mail "
            f"i zaloguj się.<br/><br/>"
            f"<b>3.</b> Po zalogowaniu otwórz panel: <font color='#0d47a1'><u>{_esc(dashboard_url)}</u></font> — "
            f"na stronie głównej użyj sekcji <b>„Szukaj mojej naprawy”</b>: "
            f"wpisz <b>numer zgłoszenia</b> (powyżej) oraz <b>numer telefonu</b> podany przy przyjęciu. "
            f"System weryfikuje zgodność na podstawie <b>ostatnich czterech cyfr</b> numeru telefonu.<br/><br/>"
            f"<b>4.</b> Po wyszukaniu zobaczysz status zgłoszenia; pełny wgląd w panelu może wymagać dopisania "
            f"naprawy do konta — w razie potrzeby skontaktuj się z serwisem, podając numer zgłoszenia "
            f"<b>{_esc(repair.repair_number)}</b>."
        )
    if email_for_print:
        panel_txt += (
            f"<br/><br/><b>4.</b> Jeśli zgłoszenie nie pojawi się automatycznie na liście, w panelu użyj "
            f"<b>„Szukaj mojej naprawy”</b> (numer zgłoszenia + telefon z przyjęcia; weryfikacja ostatnich 4 cyfr)."
        )
    story.append(Paragraph(panel_txt, styles["body"]))

    story.append(Paragraph("Potwierdzenie i regulamin", styles["h2"]))
    story.append(
        Paragraph(
            "Potwierdzam przekazanie urządzenia do serwisu oraz zapoznanie się z zasadami przyjęcia i naprawy "
            "(regulamin dostępny w serwisie i na żądanie).",
            styles["body"],
        )
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph("Podpis klienta: _________________________________ &nbsp;&nbsp;&nbsp; Data: _______________", styles["body"]))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Kontakt do serwisu", styles["h2"]))
    contact_lines = f"<b>{_esc(company)}</b><br/>"
    if addr:
        contact_lines += f"{_esc(addr)}<br/>"
    contact_lines += f"Tel. {_esc(tel)}<br/>E-mail: {_esc(em)}<br/>"
    if hours:
        contact_lines += f"Godziny: {_esc(hours)}<br/>"
    if www:
        contact_lines += f"Strona: {_esc(www)}"
    story.append(Paragraph(contact_lines, styles["contact"]))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        title=f"Potwierdzenie przyjęcia {repair.repair_number}",
    )
    doc.build(story, onFirstPage=_page_frame, onLaterPages=_page_frame)
    buffer.seek(0)
    return buffer.getvalue()


def build_complaint_warranty_intake_pdf(repair, request=None):
    """
    PDF potwierdzenia przyjęcia reklamacji lub gwarancji — A4, styl jak protokół przyjęcia.
    repair — RepairRequest (select_related client, device, parent_repair).
    """
    if getattr(repair, "repair_type", None) not in ("complaint", "warranty"):
        raise ValueError("Ten dokument jest dostępny tylko dla typu reklamacja lub gwarancja.")

    styles = _build_styles()
    client = repair.client
    device = repair.device

    company = getattr(settings, "SERWIS_PRINT_COMPANY_NAME", "PRO-KOM Serwis")
    tagline = getattr(settings, "SERWIS_PRINT_TAGLINE", "")
    tel = getattr(settings, "SERWIS_PRINT_PHONE", "")
    em = getattr(settings, "SERWIS_PRINT_EMAIL", "")
    addr = getattr(settings, "SERWIS_PRINT_ADDRESS", "")
    hours = getattr(settings, "SERWIS_PRINT_HOURS", "")
    www = getattr(settings, "SERWIS_PRINT_WEBSITE", "")

    phone = (client.phone or "").strip()
    email_for_print = _client_email_for_print(client)

    type_label = "Reklamacja" if repair.repair_type == "complaint" else "Gwarancja"
    accepted = repair.accepted_at or repair.created_at
    accepted_s = accepted.strftime("%d.%m.%Y %H:%M") if accepted else "—"

    parent = getattr(repair, "parent_repair", None)
    parent_num = parent.repair_number if parent else None

    cws = getattr(repair, "complaint_warranty_status", None) or ""
    try:
        from apps.common.enums import ComplaintWarrantyStatus

        cws_label = dict(ComplaintWarrantyStatus.choices).get(cws, cws or "—")
    except Exception:
        cws_label = cws or "—"

    repair_rows = [
        ("Typ sprawy", type_label),
        ("Numer zgłoszenia", repair.repair_number),
        ("Data przyjęcia", accepted_s),
        ("Status (reklamacja / gwarancja)", cws_label),
    ]
    if parent_num:
        repair_rows.insert(2, ("Naprawa źródłowa (ref.)", parent_num))

    client_rows: list[tuple[str, str]] = [
        ("Klient", _client_display_name(client)),
        ("Telefon", phone or "—"),
    ]
    if email_for_print:
        client_rows.append(("E-mail", email_for_print))

    device_lines = [
        ("Urządzenie", device.get_device_name()),
        ("Kategoria", _category_label(device.category)),
    ]
    if getattr(device, "color", None) and str(device.color).strip():
        device_lines.append(("Kolor", str(device.color).strip()))

    problem = (repair.problem_description or "").strip() or "—"

    story = []
    story.append(Paragraph(_esc(company), styles["title"]))
    if tagline:
        story.append(Paragraph(_esc(tagline), styles["subtitle"]))
    story.append(Paragraph(f"Potwierdzenie przyjęcia — {type_label.lower()}", styles["subtitle"]))

    ref_block = Table(
        [[Paragraph(_esc(repair.repair_number), styles["ref_box"])]],
        colWidths=[174 * mm],
    )
    ref_block.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f5f5f5")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cfcfcf")),
                ("LINEBEFORE", (0, 0), (0, 0), 5, colors.HexColor("#c41e1e")),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ]
        )
    )
    story.append(
        KeepTogether(
            [
                Paragraph("Numer sprawy — zachowaj do korespondencji", styles["ref_label"]),
                Spacer(1, 4),
                ref_block,
            ]
        )
    )
    story.append(Spacer(1, 10))

    story.append(Paragraph("Dane sprawy", styles["h2"]))
    story.append(_kv_rows(repair_rows, (52 * mm, 122 * mm), styles))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Dane klienta", styles["h2"]))
    story.append(_kv_rows(client_rows, (52 * mm, 122 * mm), styles))

    story.append(Paragraph("Urządzenie", styles["h2"]))
    story.append(_kv_rows(device_lines, (52 * mm, 122 * mm), styles))

    story.append(Paragraph("Opis zgłoszenia", styles["h2"]))
    story.append(Paragraph(_esc(problem), styles["body"]))

    story.append(Paragraph("Potwierdzenie", styles["h2"]))
    story.append(
        Paragraph(
            "Potwierdzam złożenie zgłoszenia oraz zapoznanie się z zasadami rozpatrywania reklamacji i gwarancji "
            "(regulamin dostępny w serwisie i na żądanie).",
            styles["body"],
        )
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph("Podpis klienta: _________________________________ &nbsp;&nbsp;&nbsp; Data: _______________", styles["body"]))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Kontakt do serwisu", styles["h2"]))
    contact_lines = f"<b>{_esc(company)}</b><br/>"
    if addr:
        contact_lines += f"{_esc(addr)}<br/>"
    contact_lines += f"Tel. {_esc(tel)}<br/>E-mail: {_esc(em)}<br/>"
    if hours:
        contact_lines += f"Godziny: {_esc(hours)}<br/>"
    if www:
        contact_lines += f"Strona: {_esc(www)}"
    story.append(Paragraph(contact_lines, styles["contact"]))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        title=f"Potwierdzenie {type_label} {repair.repair_number}",
    )
    doc.build(story, onFirstPage=_page_frame, onLaterPages=_page_frame)
    buffer.seek(0)
    return buffer.getvalue()


def build_acceptance_protocol_short_pdf(repair, request=None):
    """
    Skrócony protokół A4 dla naprawy z umówionym terminem (RepairVisitSchedule).
    """
    from apps.repairs.models import RepairVisitSchedule

    schedule = getattr(repair, "visit_schedule", None)
    if schedule is None:
        try:
            schedule = RepairVisitSchedule.objects.get(repair=repair)
        except RepairVisitSchedule.DoesNotExist:
            schedule = None
    if not schedule:
        raise ValueError("Naprawa nie ma umówionego terminu (RepairVisitSchedule).")

    _ensure_fonts()
    buffer = io.BytesIO()
    w, h = A4
    from reportlab.pdfgen import canvas as pdfcanvas

    company = getattr(settings, "SERWIS_PRINT_COMPANY_NAME", "PRO-KOM Serwis")
    tel = getattr(settings, "SERWIS_PRINT_PHONE", "")
    em = getattr(settings, "SERWIS_PRINT_EMAIL", "")
    addr = getattr(settings, "SERWIS_PRINT_ADDRESS", "")
    www = getattr(settings, "SERWIS_PRINT_WEBSITE", "")

    scope_text, problem_text = _split_intake_scope_and_problem(repair.problem_description or "")
    scope_line = scope_text if scope_text != "—" else "—"
    problem_short = (problem_text or "")[:120]
    if scope_line != "—" and problem_short and problem_short != "—":
        zakres_val = f"{scope_line[:80]} — {problem_short}"
    elif scope_line != "—":
        zakres_val = scope_line[:150]
    else:
        zakres_val = (problem_text or "")[:150] or "—"

    c = pdfcanvas.Canvas(buffer, pagesize=A4)
    c.setFont("DejaVuSans-Bold", 14)
    c.drawCentredString(w / 2, h - 20 * mm, company)
    c.setFont("DejaVuSans", 10)
    c.drawCentredString(w / 2, h - 27 * mm, "Protokół przyjęcia (skrócony) — umówiony termin")

    y = h - 38 * mm
    c.setFont("DejaVuSans", 10.5)

    def line(lbl, val):
        nonlocal y
        c.drawString(18 * mm, y, str(lbl) + ":")
        c.setFont("DejaVuSans", 10.5)
        c.drawString(62 * mm, y, str(val or "—")[:65])
        y -= 6 * mm
        c.setFont("DejaVuSans", 10.5)

    line("Numer naprawy", repair.repair_number)
    line("Klient", repair.client.get_full_name())
    line("Telefon", repair.client.phone)
    line("Urządzenie", repair.device.get_device_name())
    line("Zakres / opis", zakres_val)
    time_in = repair.accepted_at or repair.created_at
    line("Godzina przyjęcia", time_in.strftime("%d.%m.%Y %H:%M") if time_in else "—")
    pickup = ""
    if schedule.visit_date:
        pickup = schedule.visit_date.strftime("%d.%m.%Y")
        if schedule.estimated_pickup_time:
            pickup += " " + schedule.estimated_pickup_time.strftime("%H:%M")
        elif schedule.visit_time:
            pickup += " " + schedule.visit_time.strftime("%H:%M")
    line("Przewidywany odbiór", pickup or "—")
    y -= 6 * mm
    c.setFont("DejaVuSans", 9)
    foot = []
    if addr:
        foot.append(addr)
    if tel:
        foot.append(f"Tel. {tel}")
    if em:
        foot.append(f"E-mail: {em}")
    if www:
        foot.append(www)
    foot_s = "  ·  ".join(foot) if foot else ""
    if foot_s:
        for part in range(0, len(foot_s), 95):
            c.drawString(18 * mm, y, foot_s[part : part + 95])
            y -= 4 * mm
    y -= 6 * mm
    c.setFont("DejaVuSans", 9)
    c.drawString(18 * mm, y, "Podpis klienta: _________________________________")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
