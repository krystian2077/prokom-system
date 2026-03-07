"""
Generowanie PDF: protokół przyjęcia A4 (potwierdzenie przyjęcia sprzętu).
"""
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def build_acceptance_protocol_pdf(repair, request=None):
    """
    Buduje PDF protokołu przyjęcia (kartka A4 do wydruku dla klienta).

    repair — RepairRequest (z select_related client, device).
    request — opcjonalnie, do budowy URL statusu (np. do QR w przyszłości).
    Zwraca bytes (buffer.getvalue()).
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Nagłówek
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 25 * mm, "PRO-KOM Serwis")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 32 * mm, "Potwierdzenie przyjęcia sprzętu do naprawy")

    y = height - 45 * mm
    c.setFont("Helvetica", 10)

    def line(label, value):
        nonlocal y
        c.drawString(20 * mm, y, str(label) + ":")
        c.drawString(70 * mm, y, str(value or "—"))
        y -= 6 * mm

    line("Numer naprawy", repair.repair_number)
    line("Data przyjęcia", repair.created_at.strftime("%d.%m.%Y %H:%M") if repair.created_at else "—")
    line("Klient", repair.client.get_full_name())
    line("Telefon", repair.client.phone)
    line("E-mail", repair.client.email)
    line("Urządzenie", repair.device.get_device_name())
    line("Opis problemu", (repair.problem_description or "")[:200])
    line("Sposób odbioru", repair.get_return_method_display() if repair.return_method else "—")
    if repair.estimated_completion_date:
        line("Szacowana data zakończenia", repair.estimated_completion_date.strftime("%d.%m.%Y"))
    y -= 5 * mm
    c.setFont("Helvetica", 9)
    c.drawString(20 * mm, y, "Akceptuję regulamin serwisu i warunki naprawy.")
    y -= 8 * mm
    c.drawString(20 * mm, y, "Podpis klienta: _________________________")
    y -= 15 * mm
    c.setFont("Helvetica", 8)
    c.drawString(20 * mm, y, "Dokument wygenerowany przez system PRO-KOM. Zachowaj do odbioru.")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
