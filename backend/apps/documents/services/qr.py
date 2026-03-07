"""
Generowanie kodu QR (np. link do statusu naprawy w panelu klienta).
"""
import io
import qrcode


def build_repair_qr_image(url_or_text, size_px=200):
    """
    Buduje obrazek QR w formacie PNG.

    url_or_text — np. URL do śledzenia statusu naprawy.
    size_px — bok kwadratu w pikselach.
    Zwraca bytes (PNG).
    """
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(url_or_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img = img.resize((size_px, size_px))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()
