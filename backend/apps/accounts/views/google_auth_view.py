"""
PRO-KOM Serwis — Google OAuth2 login / rejestracja
====================================================
Endpoint AllowAny. Przyjmuje access_token z Google OAuth2 (popup flow),
weryfikuje tożsamość przez Google userinfo API, następnie:
  - jeśli konto istnieje → loguje (zwraca token DRF)
  - jeśli konta nie ma  → tworzy User + Client i loguje

Nie wymaga hasła. Email jest potwierdzony przez Google.
"""
import httpx
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token

from apps.accounts.models import User, UserRole
from apps.clients.models import Client


GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def _token_is_for_this_app(access_token: str) -> bool:
    """Audit AB4: the access token must be issued to our OAuth client (aud/azp = GOOGLE_CLIENT_ID).

    userinfo alone accepts a token issued to any other app, so a site the user signed in to
    with Google could log in here as that user.
    """
    from django.conf import settings
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
    if not client_id:
        return False
    try:
        resp = httpx.get(GOOGLE_TOKENINFO_URL, params={"access_token": access_token}, timeout=10)
        if resp.status_code != 200:
            return False
        data = resp.json()
        return client_id in (data.get("aud"), data.get("azp"))
    except Exception:
        return False


def _get_google_user_info(access_token: str) -> dict | None:
    """
    Pobiera dane użytkownika z Google userinfo API.
    Zwraca dict z email, sub, given_name, family_name lub None przy błędzie.
    """
    try:
        resp = httpx.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        if not data.get("email_verified"):
            return None
        return data
    except Exception:
        return None


class GoogleAuthView(APIView):
    """
    POST /api/v1/accounts/auth/google/
    Body: { "access_token": "<google_access_token>" }
    Zwraca: { "token": "...", "user": {...}, "created": bool }
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        access_token = (request.data.get("access_token") or "").strip()
        if not access_token:
            return Response({"detail": "Brak access_token."}, status=status.HTTP_400_BAD_REQUEST)

        if not _token_is_for_this_app(access_token):
            return Response(
                {"detail": "Nieprawidłowy token Google. Spróbuj ponownie."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        info = _get_google_user_info(access_token)
        if not info:
            return Response(
                {"detail": "Nieprawidłowy token Google. Spróbuj ponownie."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = (info.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Brak adresu e-mail w tokenie Google."}, status=status.HTTP_400_BAD_REQUEST)

        first_name = (info.get("given_name") or "").strip()
        last_name = (info.get("family_name") or "").strip()

        created = False
        try:
            user = User.objects.get(email=email)
            if user.role in (UserRole.STAFF, UserRole.ADMIN):
                return Response(
                    {"detail": "Konta pracowników nie obsługują logowania przez Google."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not user.email_verified:
                # Audit AB4: an unverified account may have been registered by someone else on
                # this address. Google proves the owner now: drop that password and its session.
                user.email_verified = True
                user.set_unusable_password()
                user.save(update_fields=["email_verified", "password"])
                Token.objects.filter(user=user).delete()
                from apps.accounts.views.auth_views import _assign_guest_repairs_to_user
                _assign_guest_repairs_to_user(user)
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=email,
                password=None,
                first_name=first_name,
                last_name=last_name,
                role=UserRole.CLIENT,
                email_verified=True,
            )
            client = Client.objects.filter(email=email, is_deleted=False, user__isnull=True).first()
            if client:
                client.user = user
                client.first_name = first_name or client.first_name
                client.last_name = last_name or client.last_name
                client.save(update_fields=["user", "first_name", "last_name", "updated_at"])
            else:
                Client.objects.create(
                    user=user,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone="",
                    country="Polska",
                )
            created = True

        if not user.is_active:
            return Response({"detail": "Konto jest nieaktywne."}, status=status.HTTP_403_FORBIDDEN)

        from apps.accounts.authentication import issue_token
        token_obj = issue_token(user)

        return Response(
            {
                "token": token_obj.key,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "email_verified": user.email_verified,
                },
                "created": created,
            },
            status=status.HTTP_200_OK,
        )
