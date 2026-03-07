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

from apps.accounts.models import LoginActivity
from apps.accounts.serializers import UserSerializer, LoginSerializer


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
