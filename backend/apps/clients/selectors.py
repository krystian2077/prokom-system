"""
PRO-KOM Serwis — Clients selectors
====================================
Logika odczytu danych klientów. Jedna odpowiedzialność — tylko odczyt.
"""
from django.db.models import Q
from apps.clients.models import Client


def client_list(*, search=None, is_vip=None, is_blacklisted=None, ordering="-created_at"):
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
        )
    if is_vip is not None:
        qs = qs.filter(is_vip=is_vip)
    if is_blacklisted is not None:
        qs = qs.filter(is_blacklisted=is_blacklisted)

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
