"""Security hotfix (audit AB2, 18.11.2026).

1. /api/v1/devices/ is staff-only: a client must not list, read or change other clients' devices
   (the serializer exposes serial number, IMEI and the device password/PIN).
2. Registration must not take over a guest client profile before the e-mail is verified:
   anyone could register with a victim's e-mail and see their repairs, messages and PDFs.
"""
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token

from apps.accounts.models import EmailVerificationCode
from apps.clients.models import Client
from apps.repairs.services.public_submit import submit_repair_from_public_form

User = get_user_model()


def _auth(api_client, user):
    token, _ = Token.objects.get_or_create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return api_client


def _guest_repair(email="ofiara@example.com"):
    with patch("apps.communications.services.send.send_repair_submission_confirmation"):
        repair, _ = submit_repair_from_public_form(
            first_name="Anna", last_name="Nowak", email=email, phone="600100200",
            category="phone", problem_description="Pęknięty ekran",
        )
    return repair


@pytest.mark.django_db
def test_client_cannot_list_or_read_devices(api_client):
    repair = _guest_repair()
    other = User.objects.create_user(email="inny@example.com", password="Pass1234!", role="client")
    _auth(api_client, other)

    assert api_client.get("/api/v1/devices/").status_code == 403
    assert api_client.post("/api/v1/devices/", {"category": "phone"}, format="json").status_code == 403
    assert api_client.get(f"/api/v1/devices/{repair.device_id}/").status_code == 403
    assert api_client.patch(f"/api/v1/devices/{repair.device_id}/", {"notes": "x"}, format="json").status_code == 403
    assert api_client.delete(f"/api/v1/devices/{repair.device_id}/").status_code == 403


@pytest.mark.django_db
def test_staff_can_still_list_devices(api_client):
    _guest_repair()
    staff = User.objects.create_user(email="staff@example.com", password="Pass1234!", role="staff")
    _auth(api_client, staff)

    response = api_client.get("/api/v1/devices/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_register_does_not_take_over_guest_profile_before_verification(api_client):
    repair = _guest_repair()
    guest = repair.client

    with patch("apps.accounts.views.auth_views._send_verification_code", return_value=object()):
        response = api_client.post("/api/v1/accounts/register/", {
            "email": guest.email, "password": "Atak1234!xyz", "first_name": "Atakujacy",
            "last_name": "X", "phone": "700800900",
        }, format="json")
    assert response.status_code == 201, response.content

    guest.refresh_from_db()
    assert guest.user_id is None
    assert (guest.first_name, guest.phone) == ("Anna", "600100200")

    attacker = User.objects.get(email=guest.email)
    assert attacker.client_profile.id != guest.id
    # Even with a token (login does not require verification) the guest repair stays invisible.
    _auth(api_client, attacker)
    listing = api_client.get("/api/v1/repairs/")
    assert listing.status_code == 200
    ids = [r["id"] for r in (listing.data.get("results", listing.data) if isinstance(listing.data, dict) else listing.data)]
    assert str(repair.id) not in ids
    assert api_client.get(f"/api/v1/repairs/{repair.id}/").status_code in (403, 404)


def _register(api_client, email, password, first_name):
    with patch("apps.accounts.views.auth_views._send_verification_code", return_value=object()):
        response = api_client.post("/api/v1/accounts/register/", {
            "email": email, "password": password, "first_name": first_name,
            "last_name": "X", "phone": "700800900",
        }, format="json")
    assert response.status_code == 201, response.content
    return User.objects.get(email=email)


def _repair_ids(api_client, user):
    _auth(api_client, user)
    listing = api_client.get("/api/v1/repairs/")
    assert listing.status_code == 200
    data = listing.data.get("results", listing.data) if isinstance(listing.data, dict) else listing.data
    return {str(r["id"]) for r in data}


@pytest.mark.django_db
def test_next_guest_submission_does_not_go_to_unverified_account(api_client):
    first = _guest_repair()
    attacker = _register(api_client, first.client.email, "Atak1234!xyz", "Atakujacy")

    second = _guest_repair()  # the victim submits again as a guest

    assert second.client_id == first.client_id
    assert second.client.user_id is None
    assert _repair_ids(api_client, attacker).isdisjoint({str(first.id), str(second.id)})


@pytest.mark.django_db
def test_guest_repairs_move_to_account_after_verification(api_client):
    repair = _guest_repair()
    owner = _register(api_client, repair.client.email, "Wlasciciel1234!", "Anna")
    assert str(repair.id) not in _repair_ids(api_client, owner)

    # Real verification endpoint with the code the e-mail would carry.
    EmailVerificationCode.objects.create(
        user=owner, code="482913", expires_at=timezone.now() + timedelta(minutes=10)
    )
    api_client.credentials()
    response = api_client.post(
        "/api/v1/accounts/verify-email/", {"email": owner.email, "code": "482913"}, format="json"
    )
    assert response.status_code == 200, response.content

    owner.refresh_from_db()
    repair.refresh_from_db()
    assert owner.email_verified
    assert repair.client_id == owner.client_profile.id
    assert str(repair.id) in _repair_ids(api_client, owner)  # positive control for the list checks
    assert Client.objects.filter(email=owner.email, user__isnull=True).exists()  # old guest row kept, empty
