"""Publiczny formularz zapytania z oferty — wysyla e-mail na adres serwisu."""
import logging
from datetime import datetime
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

INQUIRY_TO_EMAIL = "serwisprokomrabka@gmail.com"


def _build_inquiry_html(full_name, phone, email, interest, message, sent_at):
    interest_html = (
        f'<tr>'
        f'<td style="padding:10px 0;border-bottom:1px solid #2a2a3a;">'
        f'<span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:3px;">Zainteresowanie</span>'
        f'<span style="font-size:15px;color:#ffffff;font-weight:600;">{interest}</span>'
        f'</td></tr>'
        if interest else ""
    )

    return f"""<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Nowe zapytanie z oferty</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a0505 0%,#1c0808 50%,#0d0d14 100%);border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;border-bottom:2px solid #dc1e1e;">
          <div style="display:inline-block;background:#dc1e1e;border-radius:10px;padding:8px 14px;margin-bottom:16px;">
            <span style="color:#ffffff;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">PRO-KOM</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Nowe zapytanie z oferty</h1>
          <p style="margin:0;font-size:13px;color:#888;letter-spacing:0.2px;">Klient wypelnil formularz kontaktowy na stronie</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="background:#13131f;padding:0 40px 32px;">

          <!-- ALERT BADGE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 24px;">
            <tr>
              <td style="background:rgba(220,30,30,0.08);border:1px solid rgba(220,30,30,0.25);border-radius:10px;padding:14px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:8px;background:#dc1e1e;border-radius:4px;" width="8">&nbsp;</td>
                    <td style="padding-left:14px;">
                      <span style="font-size:13px;color:#dc1e1e;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Wymaga odpowiedzi</span>
                      <span style="display:block;font-size:12px;color:#999;margin-top:2px;">Odezwij sie do klienta mozliwie jak najszybciej</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- CONTACT INFO -->
          <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#dc1e1e;font-weight:700;">Dane kontaktowe</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr>
              <td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">

                  <!-- Imie i nazwisko -->
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #2a2a3a;">
                      <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:3px;">Imie i nazwisko</span>
                      <span style="font-size:16px;color:#ffffff;font-weight:700;">{full_name}</span>
                    </td>
                  </tr>

                  <!-- Telefon -->
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #2a2a3a;">
                      <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:3px;">Telefon</span>
                      <span style="font-size:15px;color:#ffffff;font-weight:600;">{phone if phone else '<span style="color:#555;">nie podano</span>'}</span>
                    </td>
                  </tr>

                  <!-- Email -->
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #2a2a3a;">
                      <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:3px;">E-mail</span>
                      <a href="mailto:{email}" style="font-size:15px;color:#dc1e1e;font-weight:600;text-decoration:none;">{email}</a>
                    </td>
                  </tr>

                  <!-- Zainteresowanie (opcjonalne) -->
                  {interest_html}

                </table>
              </td>
            </tr>
          </table>

          <!-- MESSAGE -->
          <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#dc1e1e;font-weight:700;">Tresc pytania</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#1a1a2e;border-left:3px solid #dc1e1e;border-radius:0 12px 12px 0;padding:20px 24px;">
                <p style="margin:0;font-size:15px;color:#d0d0e0;line-height:1.7;white-space:pre-wrap;">{message}</p>
              </td>
            </tr>
          </table>

          <!-- QUICK REPLY BUTTON -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="mailto:{email}?subject=Re: Zapytanie z oferty PRO-KOM"
                   style="display:inline-block;background:linear-gradient(135deg,#dc1e1e,#b81818);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                  Odpowiedz klientowi
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#0d0d14;border-top:1px solid #1e1e2e;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#555;">Wiadomosc wyslana automatycznie ze strony <strong style="color:#666;">pro-kom.eu</strong></p>
          <p style="margin:0;font-size:11px;color:#444;">{sent_at} &nbsp;&bull;&nbsp; PRO-KOM Serwis, ul. Orkana 16B, Rabka-Zdro&#769;j</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


class InquiryFormView(APIView):
    """POST — przyjmuje zapytanie z formularza oferty i wysyla e-mail do serwisu."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            data = request.data
            first_name = (data.get("first_name") or "").strip()
            last_name = (data.get("last_name") or "").strip()
            phone = (data.get("phone") or "").strip()
            email = (data.get("email") or "").strip()
            interest = (data.get("interest") or "").strip()
            message = (data.get("message") or "").strip()

            if not email or not message:
                return Response(
                    {"detail": "Pola e-mail i pytanie sa wymagane."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            full_name = f"{first_name} {last_name}".strip() or "Nieznany"
            sent_at = datetime.now().strftime("%d.%m.%Y, %H:%M")
            subject = f"Nowe zapytanie z oferty - {full_name}"

            plain_body = (
                f"Imie i nazwisko: {full_name}\n"
                f"Telefon: {phone or 'nie podano'}\n"
                f"E-mail: {email}\n"
                f"Zainteresowanie: {interest or '-'}\n"
                f"\nTresc pytania:\n{message}"
            )

            html_body = _build_inquiry_html(full_name, phone, email, interest, message, sent_at)
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@prokom.pl")

            msg = EmailMultiAlternatives(subject, plain_body, from_email, [INQUIRY_TO_EMAIL])
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=True)

            return Response({"detail": "Wiadomosc zostala wyslana."}, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.exception("InquiryFormView error: %s", exc)
            return Response(
                {"detail": "Nie udalo sie wyslac wiadomosci. Sprobuj ponownie pozniej."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
