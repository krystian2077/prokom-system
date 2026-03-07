#!/usr/bin/env python
"""
PRO-KOM Serwis — Django management utility
"""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Nie można zaimportować Django. Upewnij się, że:\n"
            "1. Django jest zainstalowane (pip install django)\n"
            "2. Virtualenv jest aktywowany (venv\\Scripts\\activate)\n"
            "3. Jesteś w katalogu backend/\n"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
