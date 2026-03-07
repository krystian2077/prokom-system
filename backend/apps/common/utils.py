"""
PRO-KOM Serwis — Common App — Utils
====================================
Wspólne helpery i funkcje pomocnicze.
"""
import random
import string
from datetime import datetime, timedelta
from django.utils import timezone
from django.utils.text import slugify


def generate_repair_number(prefix="REP"):
    """
    Generuje unikalny numer naprawy.
    Format: REP-YYYYMMDD-XXXX
    Przykład: REP-20260307-A4B2
    """
    date_part = timezone.now().strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{date_part}-{random_part}"


def generate_client_number(prefix="CLI"):
    """
    Generuje unikalny numer klienta.
    Format: CLI-XXXXXX
    Przykład: CLI-A1B2C3
    """
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{random_part}"


def format_polish_phone(phone):
    """
    Formatuje polski numer telefonu do standardowego formatu.
    Input: +48123456789, 123456789, 48123456789
    Output: +48 123 456 789
    """
    # Usuń wszystkie znaki poza cyframi
    digits = ''.join(filter(str.isdigit, phone))

    # Usuń prefix 48 jeśli istnieje
    if digits.startswith('48'):
        digits = digits[2:]

    # Sprawdź czy mamy 9 cyfr
    if len(digits) != 9:
        return phone  # Zwróć oryginalną wartość jeśli format nieprawidłowy

    # Formatuj: +48 XXX XXX XXX
    return f"+48 {digits[:3]} {digits[3:6]} {digits[6:]}"


def calculate_estimated_completion_date(start_date, estimated_days):
    """
    Oblicza szacowaną datę zakończenia naprawy.
    Pomija weekendy.
    """
    if not start_date or not estimated_days:
        return None

    current_date = start_date
    days_added = 0

    while days_added < estimated_days:
        current_date += timedelta(days=1)
        # Pomiń soboty (5) i niedziele (6)
        if current_date.weekday() < 5:
            days_added += 1

    return current_date


def create_slug_from_name(name, max_length=100):
    """
    Tworzy slug z nazwy.
    Obsługuje polskie znaki.
    """
    return slugify(name)[:max_length]


def get_public_repair_status(internal_status):
    """
    Mapuje wewnętrzny status naprawy na przyjazny status publiczny dla klienta.
    """
    from apps.common.enums import RepairStatus

    status_mapping = {
        RepairStatus.NEW: "Przyjęte do realizacji",
        RepairStatus.ACCEPTED: "Przyjęte do realizacji",
        RepairStatus.IN_DIAGNOSTICS: "Trwa diagnoza",
        RepairStatus.DIAGNOSTICS_DONE: "Diagnoza zakończona",
        RepairStatus.QUOTE_PENDING: "Przygotowywanie wyceny",
        RepairStatus.QUOTE_SENT: "Oczekiwanie na Twoją decyzję",
        RepairStatus.QUOTE_ACCEPTED: "Rozpoczynamy naprawę",
        RepairStatus.QUOTE_REJECTED: "Wycena odrzucona",
        RepairStatus.WAITING_FOR_PARTS: "Oczekiwanie na części",
        RepairStatus.IN_REPAIR: "W trakcie naprawy",
        RepairStatus.REPAIR_DONE: "Naprawa zakończona",
        RepairStatus.IN_TESTING: "Testowanie urządzenia",
        RepairStatus.TESTING_PASSED: "Testy zakończone pomyślnie",
        RepairStatus.TESTING_FAILED: "Wymaga dodatkowej naprawy",
        RepairStatus.READY_FOR_PICKUP: "Gotowe do odbioru",
        RepairStatus.PICKED_UP: "Odebrane",
        RepairStatus.SHIPPED: "Wysłane",
        RepairStatus.DELIVERED: "Dostarczone",
        RepairStatus.CANCELLED: "Anulowane",
        RepairStatus.UNREPAIRABLE: "Nie do naprawy",
        RepairStatus.ABANDONED: "Nieodebrane",
    }

    return status_mapping.get(internal_status, "Status nieznany")


def get_status_badge_color(status):
    """
    Zwraca kolor badge'a dla danego statusu (do użycia w UI).
    """
    from apps.common.enums import RepairStatus

    color_mapping = {
        RepairStatus.NEW: "blue",
        RepairStatus.ACCEPTED: "blue",
        RepairStatus.IN_DIAGNOSTICS: "purple",
        RepairStatus.DIAGNOSTICS_DONE: "purple",
        RepairStatus.QUOTE_PENDING: "yellow",
        RepairStatus.QUOTE_SENT: "yellow",
        RepairStatus.QUOTE_ACCEPTED: "green",
        RepairStatus.QUOTE_REJECTED: "red",
        RepairStatus.WAITING_FOR_PARTS: "orange",
        RepairStatus.IN_REPAIR: "indigo",
        RepairStatus.REPAIR_DONE: "green",
        RepairStatus.IN_TESTING: "purple",
        RepairStatus.TESTING_PASSED: "green",
        RepairStatus.TESTING_FAILED: "red",
        RepairStatus.READY_FOR_PICKUP: "green",
        RepairStatus.PICKED_UP: "gray",
        RepairStatus.SHIPPED: "blue",
        RepairStatus.DELIVERED: "gray",
        RepairStatus.CANCELLED: "red",
        RepairStatus.UNREPAIRABLE: "red",
        RepairStatus.ABANDONED: "gray",
    }

    return color_mapping.get(status, "gray")

