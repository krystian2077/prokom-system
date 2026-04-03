"""
PRO-KOM Serwis — Clients selectors
====================================
Logika odczytu danych klientów. Jedna odpowiedzialność — tylko odczyt.
"""
from django.db.models import Q
from apps.clients.models import Client


def _parse_bool_param(value):
    """Konwertuje query param bool na True/False/None."""
    if isinstance(value, bool):
        return value
    if value is None:
        return None
    text = str(value).strip().lower()
    if text in {"1", "true", "t", "yes", "y", "on"}:
        return True
    if text in {"0", "false", "f", "no", "n", "off"}:
        return False
    return None


def client_list(
    *,
    search=None,
    is_vip=None,
    is_blacklisted=None,
    client_type=None,
    client_segment=None,
    ordering="-created_at",
):
    """
    Lista klientów z opcjonalnym wyszukiwaniem i filtrami.
    Domyślnie wyklucza soft-deleted.
    """
    qs = Client.objects.filter(is_deleted=False)

    if search:
        qs = qs.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(email__icontains=search)
            | Q(phone__icontains=search)
            | Q(client_number__icontains=search)
            | Q(company_name__icontains=search)
        )
    parsed_is_vip = _parse_bool_param(is_vip)
    parsed_is_blacklisted = _parse_bool_param(is_blacklisted)
    if parsed_is_vip is not None:
        qs = qs.filter(is_vip=parsed_is_vip)
    if parsed_is_blacklisted is not None:
        qs = qs.filter(is_blacklisted=parsed_is_blacklisted)
    if client_type:
        qs = qs.filter(client_type=client_type)
    if client_segment:
        qs = qs.filter(client_segment=client_segment)

    return qs.order_by(ordering)


def client_by_id(client_id):
    """Pobierz klienta po ID (UUID). Zwraca None jeśli nie znaleziono lub usunięty."""
    return Client.objects.filter(id=client_id, is_deleted=False).first()


def client_by_number(client_number):
    """Pobierz klienta po numerze klienta (np. CLI-A1B2C3)."""
    return Client.objects.filter(client_number=client_number, is_deleted=False).first()


def client_by_email(email):
    """Pobierz klienta po adresie e-mail."""
    return Client.objects.filter(email=email, is_deleted=False).first()


def client_search(q, *, limit=20):
    """
    Wyszukiwanie klientów po telefonie, nazwisku, imieniu, e-mailu (do „klient wraca”).
    Zwraca listę dopasowań, limit wyników.
    """
    if not q or not str(q).strip():
        return Client.objects.filter(is_deleted=False).none()
    term = str(q).strip()
    return (
        Client.objects.filter(is_deleted=False)
        .filter(
            Q(phone__icontains=term)
            | Q(first_name__icontains=term)
            | Q(last_name__icontains=term)
            | Q(email__icontains=term)
            | Q(client_number__icontains=term)
            | Q(company_name__icontains=term)
        )
        .order_by("-visit_count", "-last_visit_at", "-created_at")[:limit]
    )
