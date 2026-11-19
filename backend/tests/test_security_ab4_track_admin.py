"""Audit AB4: /track attempts per repair (T-11) and the Django admin for superusers only (T-13)."""
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache

from apps.repairs.services.public_submit import submit_repair_from_public_form

User = get_user_model()


def _repair():
    with patch("apps.communications.services.send.send_repair_submission_confirmation"):
        repair, _ = submit_repair_from_public_form(
            first_name="Anna", last_name="Nowak", email="track@example.com", phone="600100200",
            category="phone", problem_description="Pęknięty ekran",
        )
    return repair


@pytest.mark.django_db
def test_track_locks_a_repair_after_ten_wrong_answers_from_any_ip(api_client):
    cache.clear()
    repair = _repair()
    for i in range(10):
        r = api_client.get("/api/v1/repairs/track/", {"ref": repair.repair_number, "phone_last4": f"{i:04d}"},
                           REMOTE_ADDR=f"10.0.2.{i}")
        assert r.status_code == 404
    # Even the right answer now waits — the repair is locked for an hour.
    r = api_client.get("/api/v1/repairs/track/", {"ref": repair.repair_number, "phone_last4": "0200"})
    assert r.status_code == 429


@pytest.mark.django_db
def test_track_still_works_with_the_right_phone(api_client):
    cache.clear()
    repair = _repair()
    r = api_client.get("/api/v1/repairs/track/", {"ref": repair.repair_number, "phone_last4": "0200"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_django_admin_only_for_superusers(client):
    staff = User.objects.create_user(email="pracownik@example.com", password="Mocne-Haslo-2026!x", role="staff",
                                     is_staff=True)
    client.force_login(staff)
    assert client.get("/admin/").status_code == 302  # back to the admin login, no access

    boss = User.objects.create_superuser(email="szef@example.com", password="Mocne-Haslo-2026!x")
    client.force_login(boss)
    assert client.get("/admin/").status_code == 200


@pytest.mark.django_db
def test_nine_wrong_answers_then_the_right_one_still_works(api_client):
    cache.clear()
    repair = _repair()
    for i in range(9):
        api_client.get("/api/v1/repairs/track/", {"ref": repair.repair_number, "phone_last4": f"{i:04d}"})
    r = api_client.get("/api/v1/repairs/track/", {"ref": repair.repair_number, "phone_last4": "0200"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_admin_login_form_refuses_staff_and_accepts_superuser(client):
    User.objects.create_user(email="pracownik2@example.com", password="Mocne-Haslo-2026!x", role="staff",
                             is_staff=True)
    r = client.post("/admin/login/", {"username": "pracownik2@example.com", "password": "Mocne-Haslo-2026!x"})
    assert r.status_code == 200  # the form again, with an error — no session
    assert "_auth_user_id" not in client.session

    User.objects.create_superuser(email="szef2@example.com", password="Mocne-Haslo-2026!x")
    r = client.post("/admin/login/", {"username": "szef2@example.com", "password": "Mocne-Haslo-2026!x"})
    assert r.status_code == 302
    assert "_auth_user_id" in client.session
