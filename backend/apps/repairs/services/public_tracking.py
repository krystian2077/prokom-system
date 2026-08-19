"""
PRO-KOM Serwis — dane naprawy dla publicznej strony śledzenia.

Endpoint /track jest chroniony wyłącznie numerem zgłoszenia i 4 ostatnimi cyframi
telefonu, dlatego świadomie NIE wystawiamy tu: notatek z historii statusów (bywają
wewnętrzne), danych techników, adresu klienta ani kosztów przed wysłaniem wyceny.
Kwoty pokazujemy dopiero od momentu, w którym klient i tak dostał je mailem.
"""
from django.conf import settings

from apps.common.enums import RepairStatus
from apps.common.utils import get_public_repair_status


# Uproszczona oś postępu dla klienta — wiele statusów wewnętrznych mapuje się na jeden etap.
STAGES = [
    ("received", "Przyjęte", {RepairStatus.NEW, RepairStatus.ACCEPTED}),
    ("diagnostics", "Diagnoza", {
        RepairStatus.IN_DIAGNOSTICS,
        RepairStatus.DIAGNOSTICS_DONE,
        RepairStatus.QUOTE_PENDING,
    }),
    ("quote", "Wycena", {
        RepairStatus.QUOTE_SENT,
        RepairStatus.QUOTE_ACCEPTED,
        RepairStatus.QUOTE_REJECTED,
    }),
    ("repair", "Naprawa", {
        RepairStatus.WAITING_FOR_PARTS,
        RepairStatus.IN_REPAIR,
        RepairStatus.REPAIR_DONE,
        RepairStatus.IN_TESTING,
        RepairStatus.TESTING_PASSED,
        RepairStatus.TESTING_FAILED,
    }),
    ("done", "Gotowe do odbioru", {
        RepairStatus.READY_FOR_PICKUP,
        RepairStatus.PICKED_UP,
        RepairStatus.SHIPPED,
        RepairStatus.DELIVERED,
    }),
]

# Statusy kończące sprawę bez naprawy — oś postępu traci sens, pokazujemy stan wprost.
INTERRUPTED_STATUSES = {
    RepairStatus.CANCELLED,
    RepairStatus.UNREPAIRABLE,
    RepairStatus.ABANDONED,
    RepairStatus.QUOTE_REJECTED,
}

# Od tych statusów klient zna już kwotę z maila z wyceną.
COST_VISIBLE_FROM = {
    RepairStatus.QUOTE_SENT,
    RepairStatus.QUOTE_ACCEPTED,
    RepairStatus.QUOTE_REJECTED,
    RepairStatus.WAITING_FOR_PARTS,
    RepairStatus.IN_REPAIR,
    RepairStatus.REPAIR_DONE,
    RepairStatus.IN_TESTING,
    RepairStatus.TESTING_PASSED,
    RepairStatus.TESTING_FAILED,
    RepairStatus.READY_FOR_PICKUP,
    RepairStatus.PICKED_UP,
    RepairStatus.SHIPPED,
    RepairStatus.DELIVERED,
    RepairStatus.UNREPAIRABLE,
}

FINISHED_STATUSES = {
    RepairStatus.PICKED_UP,
    RepairStatus.DELIVERED,
    RepairStatus.SHIPPED,
}


def _stage_index(status_value):
    for i, (_key, _label, members) in enumerate(STAGES):
        if status_value in members:
            return i
    return 0


def _iso(value):
    return value.isoformat() if value else None


def _money(value):
    return f"{value:.2f}" if value is not None else None


def _brand_name(device):
    """Marka: z powiązanego słownika marek albo z pola wpisanego ręcznie przy zgłoszeniu."""
    if device is None:
        return ""
    brand = getattr(device, "brand", None)
    if brand is not None:
        return getattr(brand, "name", "") or ""
    return (getattr(device, "manual_brand", "") or "").strip()


def _service_block():
    return {
        "name": getattr(settings, "SERWIS_PRINT_COMPANY_NAME", "PRO-KOM Serwis"),
        "address": getattr(settings, "SERWIS_PRINT_ADDRESS", ""),
        "phone": getattr(settings, "SERWIS_PRINT_PHONE", ""),
        "email": getattr(settings, "SERWIS_PRINT_EMAIL", ""),
        "hours": getattr(settings, "SERWIS_PRINT_HOURS", ""),
        "website": getattr(settings, "SERWIS_PRINT_WEBSITE", ""),
    }


def build_public_tracking_payload(repair):
    """Buduje komplet danych o naprawie widocznych dla klienta na stronie /track."""
    status_value = repair.status
    interrupted = status_value in INTERRUPTED_STATUSES
    device = repair.device

    history = [
        {
            "status": get_public_repair_status(h.new_status),
            "status_code": h.new_status,
            "at": _iso(h.created_at),
        }
        for h in repair.status_history.order_by("created_at")
    ]
    # Etykiety bywają wspólne dla kilku statusów wewnętrznych — nie powielamy ich na osi czasu.
    deduped = []
    for entry in history:
        if not deduped or deduped[-1]["status"] != entry["status"]:
            deduped.append(entry)

    cost = None
    if status_value in COST_VISIBLE_FROM:
        estimated = _money(getattr(repair, "estimated_cost", None))
        final = _money(getattr(repair, "final_cost", None))
        if estimated or final:
            cost = {"estimated": estimated, "final": final, "currency": "PLN"}

    return {
        "repair_number": repair.repair_number,
        "status": get_public_repair_status(status_value),
        "status_code": status_value,
        "stage_index": _stage_index(status_value),
        "stages": [{"key": k, "label": lbl} for k, lbl, _m in STAGES],
        "is_interrupted": interrupted,
        "is_finished": status_value in FINISHED_STATUSES,
        "device": {
            "name": device.get_device_name() if device else "",
            "brand": _brand_name(device),
            "category": device.get_category_display() if device else "",
        },
        "problem_description": (getattr(repair, "problem_description", "") or "").strip(),
        "created_at": _iso(repair.created_at),
        "accepted_at": _iso(repair.accepted_at),
        "estimated_completion_date": _iso(repair.estimated_completion_date),
        "estimated_duration": repair.get_estimated_duration_display() or None,
        "ready_for_pickup_at": _iso(repair.ready_for_pickup_at),
        "picked_up_at": _iso(repair.picked_up_at),
        "completed_at": _iso(repair.completed_at),
        "delivery_method": repair.get_delivery_method_display(),
        "return_method": repair.get_return_method_display(),
        "cost": cost,
        "history": deduped,
        "service": _service_block(),
    }
