"""
PRO-KOM Serwis — Production Settings (Render)
===============================================
Ustawienia produkcyjne dla hostingu Render.
"""
from .base import *  # noqa: F401, F403
import environ
import dj_database_url

env = environ.Env()
environ.Env.read_env()

# =============================================================================
# SECURITY
# =============================================================================
SECRET_KEY = env("SECRET_KEY")
DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["prokomserwis.pl", "www.prokomserwis.pl"])

# HTTPS / SSL
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "SAMEORIGIN"

# Dodatkowe nagłówki security (m.in. Permissions-Policy) bez wdrażania pełnego CSP.
MIDDLEWARE = [*MIDDLEWARE, "apps.common.security_headers.SecurityHeadersMiddleware"]

# =============================================================================
# BAZA DANYCH — Render Managed PostgreSQL
# =============================================================================
DATABASES = {
    "default": dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# =============================================================================
# CORS — tylko produkcyjne domeny
# =============================================================================
CORS_ALLOWED_ORIGINS = [
    "https://prokomserwis.pl",
    "https://www.prokomserwis.pl",
]

# =============================================================================
# REDIS — produkcja z hasłem
# =============================================================================
_redis_url = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_BROKER_URL = _redis_url
CELERY_RESULT_BACKEND = _redis_url

# =============================================================================
# EMAIL
# =============================================================================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@prokom-serwis.pl")
