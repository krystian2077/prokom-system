"""Formularz gościa nie nadpisuje danych istniejącego klienta; /track przyjmuje telefon z tego zgłoszenia."""
from unittest.mock import patch

import pytest

from apps.repairs.models import RepairNote
from apps.repairs.services.public_submit import _guest_contact_mismatch, submit_repair_from_public_form


class _C:
    first_name = "Jan"
    last_name = "Kowalski"
    phone = "600100200"


def test_mismatch_none_when_same_or_empty():
    assert _guest_contact_mismatch(_C(), "Jan", "Kowalski", "600100200") is None
    assert _guest_contact_mismatch(_C(), "", "", "") is None


def test_mismatch_lists_only_differences():
    text = _guest_contact_mismatch(_C(), "Janusz", "Kowalski", "700800900")
    assert "Imię: Janusz (w profilu: Jan)" in text
    assert "Telefon: 700800900 (w profilu: 600100200)" in text
    assert "Nazwisko" not in text


def _submit(**kw):
    base = dict(first_name="Jan", last_name="Kowalski", email="jan.test@example.com", phone="600100200",
                category="phone", problem_description="Pęknięty ekran")
    base.update(kw)
    with patch("apps.communications.services.send.send_repair_submission_confirmation"):
        return submit_repair_from_public_form(**base)


@pytest.mark.django_db(transaction=True)
def test_second_guest_submission_keeps_profile_and_tracks_both_phones(api_client):
    first, created = _submit()
    assert created is True
    second, created2 = _submit(first_name="Inny", phone="700800900")
    assert created2 is False
    client = second.client
    client.refresh_from_db()
    assert client.first_name == "Jan" and client.phone == "600100200"
    assert second.contact_phone == "700800900"
    note = RepairNote.objects.get(repair=second)
    assert note.is_internal and "700800900" in note.note

    for repair, last4 in [(first, "0200"), (second, "0900"), (second, "0200")]:
        r = api_client.get("/api/v1/repairs/track/", {"ref": repair.repair_number, "phone_last4": last4})
        assert r.status_code == 200, (repair.repair_number, last4, r.content)
    r = api_client.get("/api/v1/repairs/track/", {"ref": first.repair_number, "phone_last4": "0900"})
    assert r.status_code == 404
