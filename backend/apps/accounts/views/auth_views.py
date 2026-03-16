"""
PRO-KOM Serwis — Widoki auth
=============================
Login (zwraca token + user), Logout, Me (bieżący użytkownik).
Logowanie zapisywane w LoginActivity.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token

from django.utils import timezone as dt
from datetime import timedelta

from apps.accounts.models import (
    User,
    UserRole,
    LoginActivity,
    EmailVerificationCode,
    EmailVerificationSendLog,
    LoginFailureLog,
    EmailVerificationAttempt,
    PasswordResetToken,
)
from apps.accounts.serializers import UserSerializer, LoginSerializer, ClientRegisterSerializer
from apps.clients.models import Client
from apps.clients.selectors import client_by_email


def _assign_guest_repairs_to_user(user):
    """
    Po weryfikacji e-maila: przypisz wszystkie naprawy gościnne (client.email == user.email, client.user is None)
    do konta użytkownika. Przenosi naprawy (i ich urządzenia) do client_profile użytkownika.
    """
    from apps.repairs.models import RepairRequest
    user_client = getattr(user, "client_profile", None)
    if not user_client:
        guest = Client.objects.filter(email=user.email, user__isnull=True).first()
        if guest:
            guest.user = user
            guest.save(update_fields=["user"])
            user_client = guest
    if not user_client:
        return
    email = user.email
    guest_repairs = RepairRequest.objects.filter(
        client__email=email,
        client__user__isnull=True,
    ).exclude(client_id=user_client.id).select_related("client", "device")
    for repair in guest_repairs:
        repair.client = user_client
        repair.device.client = user_client
        repair.claim_token = None
        repair.claim_token_expires_at = None
        repair.save(update_fields=["client", "claim_token", "claim_token_expires_at"])
        repair.device.save(update_fields=["client"])


def _get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") or ""


def _log_login(request, user, login_status):
    try:
        LoginActivity.objects.create(
            user=user,
            ip_address=_get_client_ip(request) or None,
            user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:500],
            login_status=login_status,
        )
    except Exception:
        pass


def _check_login_ip_block(request):
    """Jeśli z tego IP było >= 10 nieudanych prób w ostatnich 15 min, zwraca (True, response)."""
    ip = _get_client_ip(request)
    if not ip:
        return False, None
    since = dt.now() - timedelta(minutes=15)
    count = LoginFailureLog.objects.filter(ip_address=ip, created_at__gte=since).count()
    if count >= 10:
        return True, Response(
            {"detail": "Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    return False, None


def _log_failed_login_and_maybe_lock(request, email_lower):
    """Loguje nieudaną próbę. Przy >= 20 próbach na ten e-mail w 15 min blokuje konto i wysyła e-mail."""
    ip = _get_client_ip(request)
    if ip:
        LoginFailureLog.objects.create(ip_address=ip, email_lower=email_lower or "")
    since = dt.now() - timedelta(minutes=15)
    count = LoginFailureLog.objects.filter(email_lower=email_lower, created_at__gte=since).count()
    if count >= 20:
        user = User.objects.filter(email=email_lower).first()
        if user and user.is_active:
            user.is_active = False
            user.save(update_fields=["is_active"])
            from apps.communications.services.send import send_email
            send_email(
                user.email,
                "Konto PRO-KOM Serwis zablokowane — zbyt wiele nieudanych logowań",
                "Dzień dobry,\n\nTwoje konto zostało tymczasowo zablokowane z powodu zbyt wielu nieudanych prób logowania (zabezpieczenie przed nieautoryzowanym dostępem).\n\nSkontaktuj się z nami, aby odblokować konto.\n\n— PRO-KOM Serwis",
                fail_silently=True,
            )


class LoginView(APIView):
    """
    POST /api/v1/accounts/login/
    Body: { "email": "...", "password": "..." }
    Zwraca: { "token": "...", "user": { ... } }
    Limity: 10 prób z IP / 15 min → 429; 20 prób na konto / 15 min → blokada konta + e-mail.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        blocked, response = _check_login_ip_block(request)
        if blocked:
            return response
        email_from_request = (request.data.get("email") or "").strip().lower()
        serializer = LoginSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            _log_login(request, None, "failed")
            _log_failed_login_and_maybe_lock(request, email_from_request)
            raise
        user = serializer.validated_data["user"]
        if not user.is_active:
            _log_login(request, None, "failed")
            _log_failed_login_and_maybe_lock(request, email_from_request)
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Nieprawidłowy e-mail lub hasło.")
        _log_login(request, user, "success")
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


def _send_verification_code(user):
    from apps.accounts.services.email_verification import generate_and_send_verification_code
    return generate_and_send_verification_code(user)


class RegisterView(APIView):
    """
    POST /api/v1/accounts/register/
    Body: { "email", "password", "first_name", "last_name", "phone", "street?", "city?", "postal_code?" }
    Tworzy User (role=client, email_verified=False) i powiązany Client.
    Wysyła kod OTP na e-mail. Nie zwraca tokenu — użytkownik musi zweryfikować e-mail.
    Zwraca: { "email": "..." }.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ClientRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"]
        password = data["password"]
        first_name = (data["first_name"] or "").strip()
        last_name = (data["last_name"] or "").strip()
        phone = (data["phone"] or "").strip()
        street = (data.get("street") or "").strip()
        city = (data.get("city") or "").strip()
        postal_code = (data.get("postal_code") or "").strip()

        from apps.accounts.models import UserRole

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.CLIENT,
        )
        client = client_by_email(email)
        if client:
            client.user = user
            client.first_name = first_name or client.first_name
            client.last_name = last_name or client.last_name
            client.phone = phone or client.phone
            if street or city or postal_code:
                client.street = street or client.street
                client.city = city or client.city
                client.postal_code = postal_code or client.postal_code
            client.save(update_fields=["user", "first_name", "last_name", "phone", "street", "city", "postal_code", "updated_at"])
        else:
            Client.objects.create(
                user=user,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=phone,
                street=street,
                city=city,
                postal_code=postal_code,
                country="Polska",
            )

        verification = _send_verification_code(user)
        if not verification:
            user.delete()
            return Response(
                {"detail": "Nie udało się wysłać e-maila z kodem. Spróbuj ponownie później."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"email": email},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """
    POST /api/v1/accounts/verify-email/
    Body: { "email": "...", "code": "123456" }
    Sprawdza kod OTP. Maks. 5 prób na kod. Po poprawnym: email_verified=True, zwraca token + user.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        code = (request.data.get("code") or "").strip()

        if not email or not code or len(code) != 6 or not code.isdigit():
            return Response(
                {"detail": "Podaj adres e-mail i 6-cyfrowy kod."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"detail": "Nieprawidłowy kod."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ip = _get_client_ip(request)
        if getattr(user, "verification_blocked_until", None) and dt.now() < user.verification_blocked_until:
            EmailVerificationAttempt.objects.create(user=user, email=email, ip_address=ip or "", success=False)
            delta = (user.verification_blocked_until - dt.now()).total_seconds()
            return Response(
                {"detail": "Konto tymczasowo zablokowane z powodu zbyt wielu błędnych kodów. Spróbuj za %d minut." % max(1, int(delta / 60)), "retry_after_seconds": max(0, int(delta))},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        verification = (
            EmailVerificationCode.objects.filter(user=user)
            .order_by("-created_at")
            .first()
        )
        if not verification:
            EmailVerificationAttempt.objects.create(user=user, email=email, ip_address=ip or "", success=False)
            return Response(
                {"detail": "Kod wygasł lub nie istnieje. Wyślij nowy kod."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if verification.is_expired:
            EmailVerificationAttempt.objects.create(user=user, email=email, ip_address=ip or "", success=False)
            return Response(
                {"detail": "Kod wygasł. Wyślij nowy kod.", "code_expired": True},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if verification.is_max_attempts_reached:
            verification.delete()
            EmailVerificationAttempt.objects.create(user=user, email=email, ip_address=ip or "", success=False)
            return Response(
                {"detail": "Przekroczono limit prób. Wyślij nowy kod.", "code_invalidated": True},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.code != code:
            verification.failed_attempts += 1
            verification.save(update_fields=["failed_attempts"])
            EmailVerificationAttempt.objects.create(user=user, email=email, ip_address=ip or "", success=False)
            left = 5 - verification.failed_attempts
            if verification.failed_attempts >= 5:
                user.verification_blocked_until = dt.now() + timedelta(minutes=15)
                user.save(update_fields=["verification_blocked_until"])
                verification.delete()
                return Response(
                    {"detail": "Nieprawidłowy kod. Przekroczono limit prób. Konto zablokowane na 15 minut. Wyślij nowy kod po odblokowaniu.", "code_invalidated": True},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": "Nieprawidłowy kod.", "attempts_left": left},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email_verified = True
        user.verification_blocked_until = None
        user.save(update_fields=["email_verified", "verification_blocked_until"])
        verification.delete()
        EmailVerificationAttempt.objects.create(user=user, email=email, ip_address=ip or "", success=True)

        _assign_guest_repairs_to_user(user)

        _log_login(request, user, "success")
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationCodeView(APIView):
    """
    POST /api/v1/accounts/resend-verification-code/
    Body: { "email": "..." }
    Wysyła nowy kod OTP. Limity: 60s od ostatniego wysłania, max 5 na godzinę; przy przekroczeniu blokada 1h.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"detail": "Podaj adres e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"detail": "Nieprawidłowy adres e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if getattr(user, "email_verified", False):
            return Response(
                {"detail": "Konto jest już zweryfikowane."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = dt.now()
        one_hour_ago = now - timedelta(hours=1)
        logs_last_hour = EmailVerificationSendLog.objects.filter(
            user=user, sent_at__gte=one_hour_ago
        ).order_by("sent_at")
        count_last_hour = logs_last_hour.count()
        if count_last_hour >= 5:
            oldest_in_window = logs_last_hour.first()
            block_until = oldest_in_window.sent_at + timedelta(hours=1)
            wait_seconds = max(0, int((block_until - now).total_seconds()))
            r = Response(
                {
                    "detail": "Przekroczono limit wysyłek (5 na godzinę). Spróbuj ponownie za godzinę.",
                    "retry_after_seconds": wait_seconds,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            r["Retry-After"] = str(wait_seconds)
            return r

        last_log = EmailVerificationSendLog.objects.filter(user=user).order_by("-sent_at").first()
        if last_log:
            elapsed = (now - last_log.sent_at).total_seconds()
            if elapsed < 60:
                wait_seconds = int(60 - elapsed)
                r = Response(
                    {
                        "detail": f"Poczekaj {wait_seconds} s przed ponownym wysłaniem kodu.",
                        "retry_after_seconds": wait_seconds,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
                r["Retry-After"] = str(wait_seconds)
                return r

        verification = _send_verification_code(user)
        if not verification:
            return Response(
                {"detail": "Nie udało się wysłać e-maila. Spróbuj ponownie później."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"email": email}, status=status.HTTP_200_OK)


def _send_password_reset_email(user, token_obj):
    """Wysyła e-mail z linkiem do resetu hasła (HTML + plain)."""
    from django.conf import settings
    from django.template.loader import render_to_string
    from apps.communications.services.send import send_email_html

    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    reset_url = f"{base}/client/reset-password?token={token_obj.token}"
    subject = "Reset hasła — PRO-KOM Serwis"
    body_plain = (
        f"Dzień dobry,\n\n"
        f"Otrzymaliśmy prośbę o zresetowanie hasła do konta w panelu klienta PRO-KOM Serwis.\n\n"
        f"Kliknij link (ważny 1 godzinę):\n{reset_url}\n\n"
        "Jeśli to nie Ty prosiłeś o reset, zignoruj tę wiadomość.\n\n"
        "— Zespół PRO-KOM Serwis"
    )
    html_content = render_to_string("emails/password_reset.html", {"reset_url": reset_url})
    return send_email_html(user.email, subject, body_plain, html_content, fail_silently=False)


class RequestPasswordResetView(APIView):
    """
    POST /api/v1/accounts/request-password-reset/
    Body: { "email": "..." }
    Tylko dla klientów (role=client). Wysyła e-mail z linkiem do ustawienia nowego hasła.
    Zawsze zwraca 200 (nie ujawniamy, czy konto istnieje). Limit: 3 prośby / 15 min na adres.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"detail": "Podaj adres e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(email=email, role=UserRole.CLIENT, is_active=True).first()
        if not user:
            return Response(
                {"detail": "Jeśli konto z tym adresem istnieje, wysłaliśmy na niego link do resetu hasła."},
                status=status.HTTP_200_OK,
            )
        now = dt.now()
        since = now - timedelta(minutes=15)
        recent = PasswordResetToken.objects.filter(user=user, created_at__gte=since).count()
        if recent >= 3:
            return Response(
                {"detail": "Zbyt wiele prób. Spróbuj ponownie za 15 minut."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        import secrets
        token_str = secrets.token_urlsafe(32)
        expires_at = now + timedelta(hours=1)
        token_obj = PasswordResetToken.objects.create(user=user, token=token_str, expires_at=expires_at)
        try:
            _send_password_reset_email(user, token_obj)
        except Exception:
            token_obj.delete()
            return Response(
                {"detail": "Nie udało się wysłać e-maila. Spróbuj ponownie później."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"detail": "Jeśli konto z tym adresem istnieje, wysłaliśmy na niego link do resetu hasła."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """
    POST /api/v1/accounts/reset-password/
    Body: { "token": "...", "new_password": "..." }
    Ustawia nowe hasło i unieważnia token. Min. 8 znaków.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = (request.data.get("token") or "").strip()
        new_password = (request.data.get("new_password") or "").strip()
        if not token_str:
            return Response(
                {"detail": "Brak tokenu. Użyj linku z e-maila."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not new_password or len(new_password) < 8:
            return Response(
                {"detail": "Hasło musi mieć co najmniej 8 znaków."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token_obj = PasswordResetToken.objects.filter(token=token_str).select_related("user").first()
        if not token_obj:
            return Response(
                {"detail": "Link jest nieprawidłowy lub wygasł. Poproś o nowy link."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if token_obj.is_expired:
            token_obj.delete()
            return Response(
                {"detail": "Link wygasł. Poproś o nowy link do resetu hasła."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = token_obj.user
        user.set_password(new_password)
        user.save(update_fields=["password"])
        token_obj.delete()
        return Response(
            {"detail": "Hasło zostało zmienione. Możesz się zalogować."},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """
    POST /api/v1/accounts/change-password/
    Body: { "current_password": "...", "new_password": "..." }
    Zmiana hasła zalogowanego użytkownika. Wymaga podania aktualnego hasła. Min. 8 znaków.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = (request.data.get("current_password") or "").strip()
        new_password = (request.data.get("new_password") or "").strip()
        if not current:
            return Response(
                {"detail": "Podaj aktualne hasło."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not new_password or len(new_password) < 8:
            return Response(
                {"detail": "Nowe hasło musi mieć co najmniej 8 znaków."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        if not user.check_password(current):
            return Response(
                {"detail": "Aktualne hasło jest nieprawidłowe."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        update_fields = ["password"]
        if getattr(user, "must_change_password", False):
            user.must_change_password = False
            update_fields.append("must_change_password")
        user.save(update_fields=update_fields)
        return Response(
            {"detail": "Hasło zostało zmienione."},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/v1/accounts/logout/
    Usuwa token użytkownika (po stronie serwera).
    Wymaga nagłówka: Authorization: Token <key>
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    """
    GET /api/v1/accounts/me/
    Zwraca dane zalogowanego użytkownika.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
