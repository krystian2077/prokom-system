"""
Wyświetla aktualny kod weryfikacyjny dla podanego e-maila (tylko w DEBUG).
Przydatne w development, gdy e-maile idą do konsoli i łatwo je przeoczyć.

Uruchom: python manage.py show_verification_code jan@example.com
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.accounts.models import User, EmailVerificationCode


class Command(BaseCommand):
    help = "Pokaż aktualny kod weryfikacyjny dla adresu e-mail (tylko gdy DEBUG=True)."

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Adres e-mail użytkownika")

    def handle(self, *args, **options):
        if not getattr(settings, "DEBUG", False):
            self.stderr.write("Polecenie dostępne tylko przy DEBUG=True.")
            return
        email = (options["email"] or "").strip().lower()
        if not email:
            self.stderr.write("Podaj adres e-mail.")
            return
        user = User.objects.filter(email=email).first()
        if not user:
            self.stderr.write(f"Nie znaleziono użytkownika: {email}")
            return
        code_obj = (
            EmailVerificationCode.objects.filter(user=user)
            .order_by("-created_at")
            .first()
        )
        if not code_obj:
            self.stdout.write(f"Brak aktywnego kodu weryfikacyjnego dla {email}. Użyj 'Wyślij ponownie' na stronie /client/verify-email.")
            return
        if code_obj.is_expired:
            self.stdout.write(f"Ostatni kod dla {email} wygasł (był ważny do {code_obj.expires_at}). Wyślij nowy z strony weryfikacji.")
            return
        self.stdout.write(self.style.SUCCESS(f"Kod weryfikacyjny dla {email}: {code_obj.code}"))
        self.stdout.write(f"(waży do {code_obj.expires_at})")
