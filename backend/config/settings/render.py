"""
PRO-KOM Serwis — Render (Staging) Settings
============================================
Staging na Renderze — deploy z brancha develop.
Różnice względem prod: DEBUG może być True, inne ALLOWED_HOSTS.
"""
from .prod import *  # noqa: F401, F403
import os

# Na staging można włączyć DEBUG do testów
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"

# Staging ma własną domenę (np. z Render)
_RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "")
if _RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS = list(ALLOWED_HOSTS) + [_RENDER_EXTERNAL_HOSTNAME]  # noqa: F405

# Łagodniejsze SSL na staging (opcjonalnie)
if DEBUG:
    SECURE_SSL_REDIRECT = False  # noqa: F405
    SESSION_COOKIE_SECURE = False  # noqa: F405
    CSRF_COOKIE_SECURE = False  # noqa: F405
