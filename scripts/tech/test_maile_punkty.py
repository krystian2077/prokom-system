"""
Tests of the salon-line parser and logistics context used by backend e-mails
(apps.communications.services.send.parse_point_notes / email_logistics_context).

Kept outside backend/ (forbidden zone). Run with the backend venv:
  D:/PRO-KOM/repos/prokom-system/backend/.venv/Scripts/python scripts/tech/test_maile_punkty.py
The note format is the one frontend/lib/tech/contract.ts (pointLines, buildAdditionalNotes) writes.
"""
import os
import sys
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
os.chdir(ROOT / "backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

import django  # noqa: E402

django.setup()

from apps.communications.services.send import email_logistics_context, parse_point_notes  # noqa: E402


def repair(notes="", delivery="in_person", ret="in_person", address=None):
    return SimpleNamespace(client_notes=notes, delivery_method=delivery, return_method=ret, return_address=address)


def test_parse_lines_and_clean_notes():
    p = parse_point_notes("Punkt przyjęcia: Zakopane\nPunkt odbioru: Rabka-Zdrój\n\nProszę dzwonić po 15.")
    assert p == {"dropoff": "Zakopane", "pickup": "Rabka-Zdrój", "parcel": None, "notes": "Proszę dzwonić po 15."}


def test_parse_courier_line():
    p = parse_point_notes("Wysyłka na adres: Rabka-Zdrój")
    assert p["parcel"] == "Rabka-Zdrój" and p["notes"] == ""


def test_parse_keeps_unknown_and_free_text():
    text = "Punkt przyjęcia: Kraków\nMój punkt odbioru: Zakopane\nZwykła uwaga: tak"
    p = parse_point_notes(text)
    assert p["dropoff"] is None and p["pickup"] is None
    assert p["notes"] == text


def test_parse_empty():
    assert parse_point_notes(None) == {"dropoff": None, "pickup": None, "parcel": None, "notes": ""}


def test_same_salon():
    c = email_logistics_context(repair("Punkt przyjęcia: Rabka-Zdrój"))
    assert c["dropoff_point"]["key"] == "rabka" and c["pickup_point"]["key"] == "rabka"
    assert not c["pickup_differs"]


def test_pickup_in_other_salon():
    c = email_logistics_context(repair("Punkt przyjęcia: Zakopane\nPunkt odbioru: Rabka-Zdrój"))
    assert c["pickup_differs"]
    assert "w Zakopanem" in c["pickup_sentence"] and "w Rabce-Zdroju" in c["pickup_sentence"]


def test_courier_both_ways_with_address():
    addr = SimpleNamespace(street="ul. Kwiatowa", house_number="12/4", postal_code="30-001", city="Kraków")
    c = email_logistics_context(repair("Wysyłka na adres: Rabka-Zdrój", "courier", "courier", addr))
    assert c["parcel_point"]["key"] == "rabka" and c["pickup_point"] is None
    assert c["return_address_display"] == "ul. Kwiatowa 12/4, 30-001 Kraków"
    assert "kurierem" in c["pickup_sentence"] and "po naszej stronie" in c["pickup_sentence"]
    assert "Kurier" not in c["pickup_sentence"]


def test_courier_in_pickup_other_salon():
    c = email_logistics_context(repair("Wysyłka na adres: Rabka-Zdrój\nPunkt odbioru: Zakopane", "courier"))
    assert c["pickup_point"]["key"] == "zakopane" and c["pickup_differs"]


def test_courier_without_line_defaults_to_rabka():
    c = email_logistics_context(repair("", "courier"))
    assert c["parcel_point"]["key"] == "rabka" and c["pickup_point"]["key"] == "rabka"


def test_no_lines_old_repair():
    c = email_logistics_context(repair("Uwaga"))
    assert c["dropoff_point"] is None and c["pickup_point"] is None
    assert c["client_notes_clean"] == "Uwaga"


def test_ready_wording():
    c = email_logistics_context(repair("Punkt przyjęcia: Zakopane"), ready=True)
    assert c["pickup_sentence"].startswith("Sprzęt czeka na Ciebie w salonie w Zakopanem")


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print("ok ", t.__name__)
    print(f"{len(tests)} testów OK")
