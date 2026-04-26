"""
Generowanie PDF: protokół przyjęcia A4 — potwierdzenie przyjęcia sprzętu (premium, białe tło).
"""
from __future__ import annotations

import io
from pathlib import Path
from decimal import Decimal

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
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
    _ensure_fonts()
    client = repair.client
    device = repair.device
    w, h = A4
    x0 = 13.5 * mm
    cw = w - (2 * x0)
    accent = colors.HexColor("#c5161d")
    ink = colors.HexColor("#111111")
    muted = colors.HexColor("#5a5a5a")
    line = colors.HexColor("#d9d9d9")
    line_dark = colors.HexColor("#8c8c8c")
    soft = colors.HexColor("#f8f8f8")

    company = getattr(settings, "SERWIS_PRINT_COMPANY_NAME", "PRO-KOM Tadeusz Wójciak")
    tagline = getattr(settings, "SERWIS_PRINT_TAGLINE", "Serwis elektroniki użytkowej")
    tel = getattr(settings, "SERWIS_PRINT_PHONE", "")
    em = getattr(settings, "SERWIS_PRINT_EMAIL", "")
    addr = getattr(settings, "SERWIS_PRINT_ADDRESS", "")
    hours = getattr(settings, "SERWIS_PRINT_HOURS", "")
    www = getattr(settings, "SERWIS_PRINT_WEBSITE", "") or "www.pro-kom.eu"
    phones = [p.strip() for p in (tel or "").replace("/", ",").split(",") if p.strip()]
    phone_a = phones[0] if phones else "—"
    phone_b = phones[1] if len(phones) > 1 else ""

    accepted = repair.accepted_at or repair.created_at
    accepted_s = accepted.strftime("%d.%m.%Y, %H:%M") if accepted else "—"
    phone = (client.phone or "").strip() or "—"
    email_for_print = _client_email_for_print(client) or "-"
    scope_text, problem_text = _split_intake_scope_and_problem(repair.problem_description or "")
    visual_notes = (repair.visual_condition_description or device.condition_on_arrival or "").strip() or "—"
    plan_date = repair.estimated_completion_date.strftime("%d.%m.%Y") if repair.estimated_completion_date else _duration_text(repair)
    info_note = (
        "Koszt i planowany termin mogą zostać doprecyzowane po diagnozie. "
        "Serwis skontaktuje się z klientem przed wykonaniem dodatkowych płatnych czynności, jeżeli będą wymagały akceptacji."
    )

    def y(top_mm: float) -> float:
        return h - (top_mm * mm)

    def draw_wrapped(c, text: str, x: float, y_top: float, width: float, font: str, size: float, leading: float, max_lines: int):
        c.setFont(font, size)
        lines = simpleSplit((text or "—"), font, size, width)
        for idx, ln in enumerate(lines[:max_lines]):
            c.drawString(x, y_top - (idx * leading), ln)

    def draw_top_and_footer(c, page_no: int):
        c.saveState()
        c.setFillColor(accent)
        c.rect(0, h - 3.2 * mm, w * 0.17, 3.2 * mm, fill=1, stroke=0)
        c.setFillColor(ink)
        c.rect(w * 0.17, h - 3.2 * mm, w * 0.83, 3.2 * mm, fill=1, stroke=0)
        c.setStrokeColor(line)
        c.line(x0, 8 * mm, w - x0, 8 * mm)
        c.setFont("DejaVuSans", 8.7)
        c.setFillColor(colors.HexColor("#5e5e5e"))
        c.drawString(x0, 5.1 * mm, "PRO-KOM Tadeusz Wójciak - potwierdzenie przyjęcia sprzętu do serwisu")
        c.setFont("DejaVuSans-Bold", 8.7)
        c.drawRightString(w - x0, 5.1 * mm, f"Strona {page_no}/2 - {repair.repair_number}")
        c.restoreState()

    def draw_header(c):
        c.setFillColor(muted)
        c.setFont("DejaVuSans", 9)
        c.drawRightString(x0 + cw, y(8.5), "Dokument wygenerowany elektronicznie")
        c.setStrokeColor(line)
        c.line(x0, y(48), x0 + cw, y(48))

        # logo + brand
        logo_x, logo_y = x0, y(35.5)
        c.setStrokeColor(ink)
        c.setLineWidth(1.2)
        c.rect(logo_x, logo_y, 17 * mm, 12 * mm, stroke=1, fill=0)
        c.setFillColor(accent)
        c.rect(logo_x, logo_y, 2 * mm, 12 * mm, stroke=0, fill=1)
        c.setFillColor(ink)
        c.setFont("DejaVuSans-Bold", 15)
        c.drawCentredString(logo_x + (8.5 * mm), logo_y + (4.2 * mm), "PK")

        bx = logo_x + 20 * mm
        c.setFont("DejaVuSans-Bold", 15.5)
        company_line = simpleSplit(company, "DejaVuSans-Bold", 15.5, 95 * mm)[0]
        c.drawString(bx, y(28), company_line)
        c.setFillColor(muted)
        c.setFont("DejaVuSans", 10)
        c.drawString(bx, y(33.5), tagline)
        c.setFillColor(colors.HexColor("#444444"))
        c.setFont("DejaVuSans", 9.5)
        c.drawString(bx, y(38.2), addr)

        # contact box
        cb_w, cb_h = 72 * mm, 28 * mm
        cb_x, cb_y = x0 + cw - cb_w, y(49) + 1 * mm
        c.setStrokeColor(line_dark)
        c.rect(cb_x, cb_y, cb_w, cb_h, stroke=1, fill=0)
        c.setFillColor(accent)
        c.rect(cb_x, cb_y, 4 * mm, cb_h, stroke=0, fill=1)
        c.setFillColor(muted)
        c.setFont("DejaVuSans-Bold", 9)
        c.drawString(cb_x + 5 * mm, cb_y + cb_h - 7 * mm, "KONTAKT DO SERWISU")
        c.setFillColor(ink)
        c.setFont("DejaVuSans-Bold", 11)
        c.drawString(cb_x + 5 * mm, cb_y + cb_h - 14 * mm, phone_a)
        if phone_b:
            c.drawString(cb_x + 36 * mm, cb_y + cb_h - 14 * mm, phone_b)
        draw_wrapped(c, em, cb_x + 5 * mm, cb_y + cb_h - 20.2 * mm, cb_w - 10 * mm, "DejaVuSans", 9.8, 10, 1)
        draw_wrapped(c, www, cb_x + 5 * mm, cb_y + cb_h - 24.8 * mm, cb_w - 10 * mm, "DejaVuSans", 9.8, 10, 1)

    def draw_section_title(c, top_mm: float, title: str):
        c.setFillColor(accent)
        c.roundRect(x0, y(top_mm) - 3, 4 * mm, 15, 2, stroke=0, fill=1)
        c.setFillColor(ink)
        c.setFont("DejaVuSans-Bold", 14)
        c.drawString(x0 + 6 * mm, y(top_mm), title)

    def draw_info_row(c, top_mm: float, left_label: str, left_val: str, right_label: str, right_val: str):
        row_h = 17 * mm
        col_w = (cw - 8) / 2
        for idx, (lbl, val) in enumerate(((left_label, left_val), (right_label, right_val))):
            x = x0 + (idx * (col_w + 8))
            yb = y(top_mm) - row_h
            c.setStrokeColor(line)
            c.rect(x, yb, col_w, row_h, stroke=1, fill=0)
            c.setStrokeColor(ink)
            c.line(x, y(top_mm), x + col_w, y(top_mm))
            c.setFillColor(muted)
            c.setFont("DejaVuSans-Bold", 9)
            c.drawString(x + 3 * mm, y(top_mm) - 5.5 * mm, lbl.upper())
            c.setFillColor(ink)
            c.setFont("DejaVuSans-Bold", 14 if len(val) < 16 else 12)
            c.drawString(x + 3 * mm, y(top_mm) - 13 * mm, val or "—")

    def draw_table_card(c, x: float, top_mm: float, title: str, rows: list[tuple[str, str]], height_mm: float):
        c.setFillColor(accent)
        c.roundRect(x, y(top_mm) - 3, 4 * mm, 15, 2, stroke=0, fill=1)
        c.setFillColor(ink)
        c.setFont("DejaVuSans-Bold", 14)
        c.drawString(x + 6 * mm, y(top_mm), title)
        top = top_mm + 6
        yb = y(top) - (height_mm * mm)
        box_w = (cw - 8) / 2
        c.setStrokeColor(line)
        c.roundRect(x, yb, box_w, height_mm * mm, 8, stroke=1, fill=0)
        row_h = (height_mm * mm) / len(rows)
        for i, (lbl, val) in enumerate(rows):
            yy = y(top) - ((i + 1) * row_h)
            if i != len(rows) - 1:
                c.line(x, yy, x + box_w, yy)
            split_x = x + (box_w * 0.45)
            c.line(split_x, yy, split_x, yy + row_h)
            c.setFillColor(muted)
            c.setFont("DejaVuSans-Bold", 9)
            c.drawString(x + 3 * mm, yy + row_h - 6.5 * mm, lbl.upper())
            c.setFillColor(ink)
            c.setFont("DejaVuSans-Bold", 12)
            c.drawString(split_x + 3 * mm, yy + row_h - 6.8 * mm, val or "—")

    buffer = io.BytesIO()
    from reportlab.pdfgen import canvas as pdfcanvas

    c = pdfcanvas.Canvas(buffer, pagesize=A4)

    # ===== PAGE 1 =====
    draw_top_and_footer(c, 1)
    draw_header(c)

    # hero
    hero_top = 54
    hero_h = 39 * mm
    hero_y = y(hero_top) - hero_h
    c.setStrokeColor(ink)
    c.roundRect(x0, hero_y, cw, hero_h, 12, stroke=1, fill=0)
    c.setFillColor(accent)
    c.rect(x0, hero_y, 2.5 * mm, hero_h, stroke=0, fill=1)
    c.setFillColor(muted)
    c.setFont("DejaVuSans-Bold", 9)
    c.drawString(x0 + 8.5 * mm, y(hero_top) - 7 * mm, "POTWIERDZENIE PRZYJĘCIA SPRZĘTU DO SERWISU")
    c.setFillColor(ink)
    c.setFont("DejaVuSans-Bold", 22)
    c.drawString(x0 + 8.5 * mm, y(hero_top) - 16.2 * mm, "Numer przyjęcia")
    c.setFillColor(ink)
    c.setFont("DejaVuSans-Bold", 16)
    c.drawString(x0 + 8.5 * mm, y(hero_top) - 24.3 * mm, repair.repair_number or "—")
    c.setFont("DejaVuSans", 10.2)
    draw_wrapped(
        c,
        "Zachowaj numer do odbioru urządzenia.",
        x0 + 8.5 * mm,
        y(hero_top) - 31.0 * mm,
        90 * mm,
        "DejaVuSans",
        10.2,
        10,
        1,
    )

    right_x = x0 + cw - 62 * mm - 7 * mm
    c.setFont("DejaVuSans-Bold", 11)
    c.drawString(right_x, y(hero_top) - 13 * mm, "Data przyjęcia")
    c.setFont("DejaVuSans-Bold", 14)
    c.drawString(right_x, y(hero_top) - 21 * mm, accepted_s)

    draw_section_title(c, 105, "Informacje o przyjęciu")
    draw_info_row(c, 113, "Szacunkowy koszt", _money_pl(repair.estimated_cost), "Planowany termin", plan_date)

    left_x = x0
    right_x2 = x0 + ((cw - 8) / 2) + 8
    draw_table_card(
        c,
        left_x,
        145,
        "Dane klienta",
        [("Klient", _client_display_name(client)), ("Telefon", phone), ("E-mail", email_for_print)],
        37,
    )
    device_rows = [("Model", device.get_device_name()), ("Kategoria", _category_label(device.category))]
    if getattr(device, "color", None) and str(device.color).strip():
        device_rows.append(("Kolor", str(device.color).strip()))
    device_rows.append(("Akcesoria", (device.accessories_included or "").strip() or "—"))
    draw_table_card(c, right_x2, 145, "Urządzenie", device_rows, 43)

    draw_section_title(c, 201, "Zakres serwisu i opis problemu")
    # left scope card
    scope_top = 209
    left_w = (cw - 8) / 2
    left_yb = y(scope_top) - (28 * mm)
    c.setStrokeColor(line)
    c.roundRect(x0, left_yb, left_w, 28 * mm, 8, stroke=1, fill=0)
    row_h = (28 * mm) / 2
    split_x = x0 + (left_w * 0.50)
    for i, (lbl, val) in enumerate((("Zakres naprawy", scope_text), ("Stan wizualny / uwagi", visual_notes))):
        yy = y(scope_top) - ((i + 1) * row_h)
        if i == 0:
            c.line(x0, yy, x0 + left_w, yy)
        c.line(split_x, yy, split_x, yy + row_h)
        c.setFillColor(muted)
        draw_wrapped(c, lbl.upper(), x0 + 3 * mm, yy + row_h - 5.8 * mm, (left_w * 0.50) - 6 * mm, "DejaVuSans-Bold", 8.2, 9, 2)
        c.setFillColor(ink)
        draw_wrapped(c, val, split_x + 3 * mm, yy + row_h - 7.2 * mm, left_w * 0.50 - 5 * mm, "DejaVuSans-Bold", 9.2, 11, 1)

    # problem card
    pb_x = right_x2
    pb_yb = left_yb
    c.setStrokeColor(line_dark)
    c.roundRect(pb_x, pb_yb, left_w, 28 * mm, 8, stroke=1, fill=0)
    c.setFillColor(accent)
    c.rect(pb_x, pb_yb, 5 * mm, 28 * mm, stroke=0, fill=1)
    c.setFillColor(ink)
    c.setFont("DejaVuSans-Bold", 12)
    c.drawString(pb_x + 6 * mm, pb_yb + 22 * mm, "Opis problemu")
    draw_wrapped(c, problem_text, pb_x + 6 * mm, pb_yb + 16.8 * mm, left_w - 8 * mm, "DejaVuSans", 11, 12, 2)

    # note
    note_top = 246
    note_h = 30 * mm
    note_yb = y(note_top) - note_h
    c.setStrokeColor(line)
    c.roundRect(x0, note_yb, cw, note_h, 8, stroke=1, fill=0)
    c.setFillColor(ink)
    c.setFont("DejaVuSans-Bold", 12)
    c.drawString(x0 + 5 * mm, note_yb + note_h - 7 * mm, "Informacja dla klienta")
    draw_wrapped(c, info_note, x0 + 5 * mm, note_yb + note_h - 12.2 * mm, cw - 10 * mm, "DejaVuSans", 10.2, 11, 4)

    # ===== PAGE 2 =====
    c.showPage()
    draw_top_and_footer(c, 2)
    draw_header(c)

    draw_section_title(c, 56, "Śledzenie naprawy w panelu klienta")
    steps = [
        ("Załóż konto lub zaloguj się", "Wejdź na stronę www.pro-kom.eu i przejdź do panelu klienta."),
        ("Wyszukaj zgłoszenie", "Wpisz numer zgłoszenia oraz numer telefonu podany przy przyjęciu."),
        ("Sprawdzaj aktualizacje", "W panelu zobaczysz aktualizacje naprawy, historię działań oraz wiadomości z serwisu."),
    ]
    st_top = 64
    for idx, (ttl, desc) in enumerate(steps, start=1):
        y_top = st_top + ((idx - 1) * 23)
        box_h = 18 * mm
        yb = y(y_top) - box_h
        c.setStrokeColor(line)
        c.roundRect(x0, yb, cw, box_h, 8, stroke=1, fill=0)
        n_x = x0 + 4 * mm
        n_y = yb + box_h - 9.5 * mm
        c.setStrokeColor(ink)
        c.roundRect(n_x, n_y, 7.5 * mm, 7.5 * mm, 2, stroke=1, fill=0)
        c.setFillColor(accent)
        c.rect(n_x, n_y, 2 * mm, 7.5 * mm, stroke=0, fill=1)
        c.setFillColor(ink)
        c.setFont("DejaVuSans-Bold", 11)
        c.drawCentredString(n_x + 4.5 * mm, n_y + 2.3 * mm, str(idx))
        c.setFont("DejaVuSans-Bold", 12)
        c.drawString(x0 + 18 * mm, yb + box_h - 7.2 * mm, ttl)
        c.setFont("DejaVuSans", 10.8)
        c.drawString(x0 + 18 * mm, yb + box_h - 12.8 * mm, desc)

    # notice
    n_top = 136
    n_h = 16 * mm
    n_yb = y(n_top) - n_h
    c.setStrokeColor(line_dark)
    c.roundRect(x0, n_yb, cw, n_h, 8, stroke=1, fill=0)
    c.setFillColor(accent)
    c.rect(x0, n_yb, 5 * mm, n_h, stroke=0, fill=1)
    c.setFillColor(ink)
    c.setFont("DejaVuSans-Bold", 12)
    c.drawString(x0 + 6 * mm, n_yb + n_h - 7.5 * mm, "Ważne:")
    draw_wrapped(
        c,
        f"Jeżeli zgłoszenie nie pojawi się w panelu, skontaktuj się z serwisem i podaj numer {repair.repair_number}.",
        x0 + 28 * mm,
        n_yb + n_h - 7.5 * mm,
        cw - 34 * mm,
        "DejaVuSans",
        11,
        12,
        2,
    )

    # signatures
    sig_top = 175
    sig_h = 38 * mm
    sig_yb = y(sig_top) - sig_h
    sig_w = (cw - 16) / 2
    for idx, title in enumerate(("Podpis klienta", "Podpis pracownika")):
        sx = x0 + (idx * (sig_w + 16))
        c.setStrokeColor(line_dark)
        c.roundRect(sx, sig_yb, sig_w, sig_h, 8, stroke=1, fill=0)
        c.setFillColor(ink)
        c.setFont("DejaVuSans-Bold", 12)
        c.drawString(sx + 4 * mm, sig_yb + sig_h - 9 * mm, title)
        c.setStrokeColor(ink)
        c.line(sx + 4 * mm, sig_yb + 14 * mm, sx + sig_w - 4 * mm, sig_yb + 14 * mm)
        c.setFillColor(muted)
        c.setFont("DejaVuSans", 10)
        if idx == 0:
            c.drawString(sx + 4 * mm, sig_yb + 8 * mm, "Czytelny podpis klienta")
        else:
            c.drawString(sx + 4 * mm, sig_yb + 8 * mm, "Podpis osoby przyjmującej sprzęt")

    # contact final
    cf_top = 226
    cf_h = 36 * mm
    cf_yb = y(cf_top) - cf_h
    c.setStrokeColor(ink)
    c.roundRect(x0, cf_yb, cw, cf_h, 9, stroke=1, fill=0)
    c.setFillColor(accent)
    c.rect(x0, cf_yb, 5 * mm, cf_h, stroke=0, fill=1)
    left_w = cw * 0.56
    c.setFillColor(ink)
    c.setFont("DejaVuSans-Bold", 12)
    c.drawString(x0 + 6 * mm, cf_yb + cf_h - 9 * mm, "Kontakt do serwisu")
    c.setFont("DejaVuSans", 11)
    c.drawString(x0 + 6 * mm, cf_yb + cf_h - 15 * mm, company)
    c.drawString(x0 + 6 * mm, cf_yb + cf_h - 21 * mm, addr)
    c.drawString(x0 + 6 * mm, cf_yb + cf_h - 27 * mm, f"Strona: {www}")

    tx = x0 + left_w + 8
    c.setFont("DejaVuSans-Bold", 12)
    c.drawString(tx, cf_yb + cf_h - 9 * mm, f"Tel. {phone_a}")
    c.setFont("DejaVuSans", 11)
    if phone_b:
        c.drawString(tx, cf_yb + cf_h - 15 * mm, f"Tel. {phone_b}")
        c.drawString(tx, cf_yb + cf_h - 21 * mm, f"E-mail: {em}")
        c.drawString(tx, cf_yb + cf_h - 27 * mm, hours)
    else:
        c.drawString(tx, cf_yb + cf_h - 15 * mm, f"E-mail: {em}")
        c.drawString(tx, cf_yb + cf_h - 21 * mm, hours)

    c.save()
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
