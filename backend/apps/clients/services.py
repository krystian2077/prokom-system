"""
PRO-KOM Serwis — Clients services
==================================
Aktualizacja visit_count i segmentu przy nowej naprawie („klient wraca”).
"""
from django.utils import timezone

from apps.clients.models import Client
from apps.common.enums import ClientSegment


def update_client_visit_and_segment(client_id):
    """
    Wywołaj po przyjęciu nowej naprawy (nowe zgłoszenie) dla klienta.
    Inkrementuje visit_count, ustawia last_visit_at i aktualizuje client_segment.
    """
    client = Client.objects.filter(id=client_id).first()
    if not client:
        return
    client.visit_count = (client.visit_count or 0) + 1
    client.last_visit_at = timezone.now()
    # Segment: biznesowy bez zmian; indywidualni: new -> returning -> regular
    if client.client_type == "business":
        if client.client_segment != ClientSegment.BUSINESS:
            client.client_segment = ClientSegment.BUSINESS
    else:
        if client.visit_count >= 3:
            client.client_segment = ClientSegment.REGULAR
        elif client.visit_count >= 2:
            client.client_segment = ClientSegment.RETURNING
        # visit_count == 1 pozostawiamy new (domyślnie przy tworzeniu)
    client.save(update_fields=["visit_count", "last_visit_at", "client_segment", "updated_at"])
