from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

TOKEN_EXPIRY_HOURS = getattr(settings, "TOKEN_EXPIRY_HOURS", 12)


def issue_token(user):
    """Token for a fresh login (audit AB4): an expired one is replaced, not handed out again.

    ExpiringTokenAuthentication drops an old token only when a request brings it, so a plain
    get_or_create at login could return a token that fails on the very first request.
    """
    from rest_framework.authtoken.models import Token
    hours = getattr(settings, "TOKEN_EXPIRY_HOURS", TOKEN_EXPIRY_HOURS)
    Token.objects.filter(user=user, created__lt=timezone.now() - timedelta(hours=hours)).delete()
    token, _ = Token.objects.get_or_create(user=user)
    return token


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related("user").get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed("Nieprawidłowy token.")

        if not token.user.is_active:
            raise AuthenticationFailed("Konto nieaktywne.")

        expiry = timedelta(hours=getattr(settings, "TOKEN_EXPIRY_HOURS", TOKEN_EXPIRY_HOURS))
        if timezone.now() > token.created + expiry:
            token.delete()
            raise AuthenticationFailed("Sesja wygasła. Zaloguj się ponownie.")

        return (token.user, token)
