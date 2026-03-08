"""
PRO-KOM Serwis — Pricing services.
Tworzenie snapshotu wyceny, rejestrowanie decyzji klienta.
"""
from django.utils import timezone
from django.db import models

from apps.pricing.models import Quote, QuoteVersion, QuoteDecision


def create_quote_version_snapshot(quote, created_by_id=None):
    """
    Tworzy snapshot wersji wyceny (total + pozycje jako JSON).
    Wywołać przy wysłaniu wyceny (status -> sent) lub przy istotnej zmianie.
    """
    next_num = (quote.versions.aggregate(m=models.Max("version_number"))["m"] or 0) + 1
    items_snapshot = [
        {
            "item_type": i.item_type,
            "description": i.description or "",
            "quantity": str(i.quantity),
            "unit_price": str(i.unit_price),
            "total": str(i.total),
        }
        for i in quote.items.all()
    ]
    QuoteVersion.objects.create(
        quote=quote,
        version_number=next_num,
        total_amount=quote.total_amount,
        items_snapshot=items_snapshot,
        created_by_id=created_by_id,
    )


def save_quote_decision(quote, decision, decided_by_id=None, comment=""):
    """Zapisuje decyzję klienta (akceptacja/odrzucenie). Jedna na wycenę."""
    if hasattr(quote, "decision") and quote.decision:
        quote.decision.decision = decision
        quote.decision.decided_at = timezone.now()
        quote.decision.decided_by_id = decided_by_id
        quote.decision.comment = comment or quote.decision.comment
        quote.decision.save()
        return quote.decision
    return QuoteDecision.objects.create(
        quote=quote,
        decision=decision,
        decided_by_id=decided_by_id,
        comment=comment or "",
    )


