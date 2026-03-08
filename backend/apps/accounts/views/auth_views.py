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

from apps.accounts.models import User, LoginActivity
from apps.accounts.serializers import UserSerializer, LoginSerializer, ClientRegisterSerializer
from apps.clients.models import Client
from apps.clients.selectors import client_by_email


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


class LoginView(APIView):
    """
    POST /api/v1/accounts/login/
    Body: { "email": "...", "password": "..." }
    Zwraca: { "token": "...", "user": { ... } }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            _log_login(request, None, "failed")
            raise
        user = serializer.validated_data["user"]
        _log_login(request, user, "success")
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    """
    POST /api/v1/accounts/register/
    Body: { "email", "password", "first_name", "last_name", "phone", "street?", "city?", "postal_code?" }
    Tworzy User (role=client) i powiązany Client (lub łączy z istniejącym po email).
    Zwraca: { "token": "...", "user": { ... } } — jak przy logowaniu.
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
        _log_login(request, user, "success")
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
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
