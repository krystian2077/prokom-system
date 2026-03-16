"""
Generowanie i wysyłka kodu OTP do weryfikacji e-maila.
Kod 6-cyfrowy, ważny 15 minut. Każdy nowy kod unieważnia poprzednie dla danego użytkownika.
"""
import logging
import random
import sys
from django.utils import timezone
from datetime import timedelta

from django.template.loader import render_to_string

from apps.accounts.models import EmailVerificationCode, EmailVerificationSendLog
from apps.communications.services.send import send_email_html

logger = logging.getLogger(__name__)


def generate_and_send_verification_code(user, log_send=True):
    """
    Unieważnia poprzednie kody dla użytkownika, generuje nowy 6-cyfrowy kod,
    zapisuje z ważnością 15 min i wysyła e-mail.
    Gdy log_send=True, zapisuje wpis w EmailVerificationSendLog (do limitów resend).
    Zwraca utworzony obiekt EmailVerificationCode lub None przy błędzie wysyłki.
    """
    EmailVerificationCode.objects.filter(user=user).delete()

    code = "".join(str(random.randint(0, 9)) for _ in range(6))
    expires_at = timezone.now() + timedelta(minutes=15)
    verification = EmailVerificationCode.objects.create(
        user=user,
        code=code,
        expires_at=expires_at,
    )

    subject = "Kod weryfikacyjny — PRO-KOM Serwis"
    body_plain = (
        f"Twój kod weryfikacyjny: {code}\n\n"
        "Kod jest ważny przez 15 minut.\n\n"
        "Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.\n\n"
        "— PRO-KOM Serwis"
    )
    html_content = render_to_string("emails/verification_code.html", {"code": code})

    # W development: wypisz kod na stderr (zawsze widać w terminalu runserver)
    from django.conf import settings
    if getattr(settings, "DEBUG", False):
        print("\n" + "=" * 60, file=sys.stderr)
        print("KOD WERYFIKACYJNY", file=sys.stderr)
        print(f"  E-mail: {user.email}", file=sys.stderr)
        print(f"  Kod:    {code}", file=sys.stderr)
        print("=" * 60 + "\n", file=sys.stderr)
        sys.stderr.flush()

    try:
        send_email_html(user.email, subject, body_plain, html_content, fail_silently=False)
    except Exception as e:
        logger.exception("Błąd wysyłki e-mail z kodem weryfikacji do %s: %s", user.email, e)
        verification.delete()
        return None
    if log_send:
        EmailVerificationSendLog.objects.create(user=user)
    return verification
