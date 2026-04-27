from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

TOKEN_EXPIRY_HOURS = getattr(settings, "TOKEN_EXPIRY_HOURS", 12)


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related("user").get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed("Nieprawidłowy token.")

        if not token.user.is_active:
            raise AuthenticationFailed("Konto nieaktywne.")

        expiry = timedelta(hours=TOKEN_EXPIRY_HOURS)
        if timezone.now() > token.created + expiry:
            token.delete()
            raise AuthenticationFailed("Sesja wygasła. Zaloguj się ponownie.")

        return (token.user, token)
