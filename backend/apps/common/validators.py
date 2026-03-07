"""
PRO-KOM Serwis — Common App — Validators
=========================================
Wspólne walidatory dla formularzy i modeli.
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_polish_phone(value):
    """
    Walidacja polskiego numeru telefonu.
    Akceptuje formaty:
    - 123456789
    - +48123456789
    - +48 123 456 789
    - 48123456789
    """
    # Usuń spacje, myślniki i plus
    cleaned = re.sub(r'[\s\-\+]', '', value)

    # Sprawdź czy zaczyna się od 48
    if cleaned.startswith('48'):
        cleaned = cleaned[2:]

    # Sprawdź czy pozostała część to 9 cyfr
    if not re.match(r'^\d{9}$', cleaned):
        raise ValidationError(
            _('Nieprawidłowy numer telefonu. Użyj formatu: 123456789 lub +48 123 456 789'),
            code='invalid_phone'
        )


def validate_imei(value):
    """
    Walidacja numeru IMEI.
    IMEI to 15-cyfrowy numer.
    Puste wartości są akceptowane (pole może być blank).
    """
    if not value or not str(value).strip():
        return
    cleaned = re.sub(r'[\s\-]', '', value)

    if not re.match(r'^\d{15}$', cleaned):
        raise ValidationError(
            _('Nieprawidłowy numer IMEI. IMEI składa się z 15 cyfr.'),
            code='invalid_imei'
        )


def validate_serial_number(value):
    """
    Walidacja numeru seryjnego.
    Numer seryjny może zawierać litery, cyfry i niektóre znaki specjalne.
    Długość: 5-50 znaków. Puste wartości są akceptowane (pole może być blank).
    """
    if not value or not str(value).strip():
        return
    if not re.match(r'^[A-Z0-9\-_]{5,50}$', value.upper()):
        raise ValidationError(
            _('Nieprawidłowy numer seryjny. Dozwolone znaki: A-Z, 0-9, -, _ (5-50 znaków)'),
            code='invalid_serial'
        )

