"""
PRO-KOM Serwis — Base Django Settings
======================================
Wspólne ustawienia dla wszystkich środowisk.
Nie używaj tego pliku bezpośrednio — używaj local.py lub prod.py.
"""
from pathlib import Path
import environ

# Ścieżka do katalogu backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Inicjalizacja django-environ
env = environ.Env()

# =============================================================================
# APLIKACJE
# =============================================================================
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "simple_history",
    "django_celery_beat",
]

LOCAL_APPS = [
    "apps.common",
    "apps.accounts",
    "apps.clients",
    "apps.devices",
    "apps.repairs",
    "apps.diagnostics",
    "apps.pricing",
    "apps.inventory",
    "apps.orders",
    "apps.tasks",
    "apps.availability",
    "apps.accessories",
    "apps.hammer_glass",
    "apps.communications",
    "apps.timelines",
    "apps.calendar_app",
    "apps.documents",
    "apps.analytics",
    "apps.compliance",
    "apps.search",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# =============================================================================
# MIDDLEWARE
# =============================================================================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

# =============================================================================
# URL / WSGI
# =============================================================================
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

# =============================================================================
# TEMPLATES
# =============================================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# =============================================================================
# CUSTOM USER MODEL
# =============================================================================
AUTH_USER_MODEL = "accounts.User"

# =============================================================================
# PASSWORD VALIDATORS
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================
LANGUAGE_CODE = "pl"
TIME_ZONE = "Europe/Warsaw"
USE_I18N = True
USE_TZ = True

# =============================================================================
# STATIC FILES
# =============================================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# =============================================================================
# MEDIA FILES
# =============================================================================
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# =============================================================================
# DEFAULT PRIMARY KEY
# =============================================================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# =============================================================================
# FRONTEND (linki w e-mailach: śledzenie, claim-repair)
# =============================================================================
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", default="http://localhost:3000")

# Webhook skrzynki przychodzącej (e-mail → wątek naprawy); pusty = endpoint zwraca 503
EMAIL_INBOUND_WEBHOOK_SECRET = env("EMAIL_INBOUND_WEBHOOK_SECRET", default="")

# Polling IMAP (np. Gmail) — hasło aplikacji; puste = komenda poll_inbound_imap kończy się komunikatem
INBOUND_IMAP_HOST = env("INBOUND_IMAP_HOST", default="imap.gmail.com")
INBOUND_IMAP_USER = env("INBOUND_IMAP_USER", default="")
INBOUND_IMAP_PASSWORD = env("INBOUND_IMAP_PASSWORD", default="")
INBOUND_IMAP_MAILBOX = env("INBOUND_IMAP_MAILBOX", default="INBOX")

# =============================================================================
# DJANGO REST FRAMEWORK
# =============================================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
}

# =============================================================================
# DRF SPECTACULAR (dokumentacja API)
# =============================================================================
SPECTACULAR_SETTINGS = {
    "TITLE": "PRO-KOM Serwis API",
    "DESCRIPTION": "API systemu zarządzania serwisem elektroniki PRO-KOM",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# =============================================================================
# CORS
# =============================================================================
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# CELERY
# =============================================================================
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# =============================================================================
# PRO-KOM — Adres paczkomatu (formularz zgłoszenia, etykiety)
# =============================================================================
PARCEL_LOCKER_ADDRESS = env(
    "PARCEL_LOCKER_ADDRESS",
    default="Zakopiańska 10f, Rabka-Zdrój 34-700, przy stacji benzynowej Moya",
)

# =============================================================================
# LOGGING
# =============================================================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
