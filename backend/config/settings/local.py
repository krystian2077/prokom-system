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
# EMAIL — lokalnie wyświetlaj w konsoli
# =============================================================================
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# =============================================================================
# DEBUG TOOLBAR — opcjonalnie
# =============================================================================
INTERNAL_IPS = ["127.0.0.1"]
