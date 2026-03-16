"""
PRO-KOM Serwis — Local (Development) Settings
===============================================
Ustawienia do pracy lokalnej na Twoim komputerze.
"""
from .base import *  # noqa: F401, F403
import environ

env = environ.Env()

# Wczytaj plik .env z katalogu backend/
environ.Env.read_env(BASE_DIR / ".env")  # noqa: F405

# =============================================================================
# SECURITY
# =============================================================================
SECRET_KEY = env("SECRET_KEY", default="dev-secret-key-change-in-production-prokom-2025")
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# =============================================================================
# BAZA DANYCH — SQLite lokalnie (tymczasowo)
# =============================================================================
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

# Użyj PostgreSQL po jego zainstalowaniu:
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": env("DB_NAME", default="prokom_db"),
#         "USER": env("DB_USER", default="postgres"),
#         "PASSWORD": env("DB_PASSWORD", default="postgres"),
#         "HOST": env("DB_HOST", default="localhost"),
#         "PORT": env("DB_PORT", default="5432"),
#     }
# }

# =============================================================================
# CORS — lokalny frontend Next.js
# =============================================================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
    "http://localhost:3004",
    "http://127.0.0.1:3004",
]

# =============================================================================
# EMAIL — SMTP gdy podane w .env, inaczej konsola (development)
# =============================================================================
# Aby wysyłać prawdziwe e-maile: uzupełnij w .env:
#   EMAIL_HOST_USER=...
#   EMAIL_HOST_PASSWORD=...
# (opcjonalnie EMAIL_HOST, EMAIL_PORT, DEFAULT_FROM_EMAIL)
# Gdy tych zmiennych brak lub są puste — e-maile trafiają do konsoli (runserver).
_use_smtp = bool(env("EMAIL_HOST_USER", default="").strip() and env("EMAIL_HOST_PASSWORD", default="").strip())
if _use_smtp:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
    EMAIL_PORT = env.int("EMAIL_PORT", default=587)
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = env("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
    DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default=env("EMAIL_HOST_USER", default="noreply@prokom-serwis.pl"))
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@prokom-serwis.pl")

# =============================================================================
# DEBUG TOOLBAR — opcjonalnie
# =============================================================================
INTERNAL_IPS = ["127.0.0.1"]
