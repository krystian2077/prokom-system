"""
PRO-KOM Serwis — Settings entry point.
Ustaw DJANGO_SETTINGS_MODULE na:
- config.settings.local — rozwój lokalny
- config.settings.prod — produkcja (np. Render production)
- config.settings.render — staging na Render (branch develop)
"""
import os

_env = os.environ.get("DJANGO_ENV", "local")

if _env == "production" or _env == "prod":
    from .prod import *  # noqa: F401, F403
elif _env == "render":
    from .render import *  # noqa: F401, F403
else:
    from .local import *  # noqa: F401, F403
