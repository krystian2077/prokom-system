"""
Heurystyczne propozycje zadań powiązanych z naprawą (bez zapisu w DB).
"""
from __future__ import annotations

from typing import Any

from apps.common.enums import RepairStatus
from apps.repairs.models import RepairRequest

from .enums import TaskPriority, TaskStatus
from .models import Task

_OPEN_TASK_STATUSES = (
    TaskStatus.NEW,
    TaskStatus.IN_PROGRESS,
    TaskStatus.WAITING,
)


def _s(
    *,
    suggestion_key: str,
    title: str,
    priority: str = TaskPriority.STANDARD,
    description: str = "",
    reason_label: str = "status",
) -> dict[str, Any]:
    return {
        "suggestion_key": suggestion_key,
        "title": title,
        "description": description.strip(),
        "priority": priority,
        "reason_label": reason_label,
    }


def _status_suggestions(repair: RepairRequest) -> list[dict[str, Any]]:
    s = repair.status
    out: list[dict[str, Any]] = []

    if s == RepairStatus.WAITING_FOR_PARTS:
        out.append(
            _s(
                suggestion_key="status:waiting_for_parts:followup",
                title="Sprawdzić status zamówienia części",
                priority=TaskPriority.IMPORTANT,
                reason_label="status",
            )
        )
    elif s == RepairStatus.QUOTE_SENT:
        out.append(
            _s(
                suggestion_key="status:quote_sent:remind",
                title="Przypomnieć klientowi o wycenie",
                priority=TaskPriority.IMPORTANT,
                reason_label="status",
            )
        )
    elif s == RepairStatus.READY_FOR_PICKUP:
        out.append(
            _s(
                suggestion_key="status:ready_for_pickup:contact",
                title="Skontaktować się w sprawie odbioru",
                priority=TaskPriority.IMPORTANT,
                reason_label="status",
            )
        )
        out.append(
            _s(
                suggestion_key="status:ready_for_pickup:foil",
                title="Nałożyć folię Hammer Glass przed wydaniem",
                priority=TaskPriority.STANDARD,
                reason_label="status",
            )
        )
    elif s == RepairStatus.IN_REPAIR:
        out.append(
            _s(
                suggestion_key="status:in_repair:continue",
                title="Kontynuować naprawę według ustalonego planu",
                priority=TaskPriority.STANDARD,
                reason_label="status",
            )
        )
    elif s == RepairStatus.QUOTE_PENDING:
        out.append(
            _s(
                suggestion_key="status:quote_pending:prepare",
                title="Przygotować wycenę dla klienta",
                priority=TaskPriority.IMPORTANT,
                reason_label="status",
            )
        )
    elif s in (RepairStatus.IN_DIAGNOSTICS, RepairStatus.NEW, RepairStatus.ACCEPTED):
        out.append(
            _s(
                suggestion_key="status:early:diagnostics",
                title="Uzupełnić diagnostykę i ustalić kolejne kroki",
                priority=TaskPriority.STANDARD,
                reason_label="status",
            )
        )
    elif s == RepairStatus.TESTING_FAILED:
        out.append(
            _s(
                suggestion_key="status:testing_failed:retest",
                title="Sprawdzić ponownie po poprawkach (test nie przeszedł)",
                priority=TaskPriority.URGENT,
                reason_label="status",
            )
        )

    return out


def _keyword_suggestions(repair: RepairRequest) -> list[dict[str, Any]]:
    text = (repair.problem_description or "").lower()
    out: list[dict[str, Any]] = []

    def kw(key: str, *words: str, title: str, priority: str = TaskPriority.STANDARD) -> None:
        if any(w in text for w in words):
            out.append(
                _s(
                    suggestion_key=key,
                    title=title,
                    priority=priority,
                    reason_label="problem",
                )
            )

    kw(
        "kw:screen",
        "wyświetlacz",
        "ekran",
        "display",
        "screen",
        title="Zamówić / dopasować wyświetlacz",
        priority=TaskPriority.IMPORTANT,
    )
    kw("kw:battery", "bateria", "baterii", "battery", "akumulator", title="Zamówić / wymienić baterię")
    kw(
        "kw:touch",
        "dotyk",
        "digitizer",
        "touchscreen",
        "panel dotykowy",
        title="Przetestować digitizer / dotyk po naprawie",
    )
    kw("kw:charging", "ładowanie", "charging", "usb", "port", "gniazdo", title="Sprawdzić ładowanie i port")
    kw("kw:camera", "kamera", "camera", "aparat", "zdjęć", title="Sprawdzić działanie aparatu")
    kw("kw:back", "obudowa", "tył", "back glass", title="Sprawdzić obudowę / szkło tylne")

    return out


def raw_suggestions_for_repair(repair: RepairRequest) -> list[dict[str, Any]]:
    """Wszystkie propozycje przed odfiltrowaniem istniejących zadań."""
    by_key: dict[str, dict[str, Any]] = {}
    for item in _status_suggestions(repair) + _keyword_suggestions(repair):
        k = item["suggestion_key"]
        if k not in by_key:
            by_key[k] = item
    return list(by_key.values())


def suggestions_for_repair(repair: RepairRequest, user) -> list[dict[str, Any]]:
    """
    Propozycje heurystyczne tylko wtedy, gdy użytkownik nie ma **otwartych** zadań
    przypisanych do siebie przy tej naprawie — najpierw dokończ bieżące, potem system zaproponuje kolejne.
    Ręczne dodawanie (formularz / szablony) pozostaje bez ograniczeń.
    """
    has_open = Task.objects.filter(
        assigned_to_id=user.id,
        related_repair_id=repair.pk,
        status__in=_OPEN_TASK_STATUSES,
    ).exists()
    if has_open:
        return []
    return raw_suggestions_for_repair(repair)
