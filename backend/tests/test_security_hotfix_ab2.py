"""Security hotfix (audit AB2, 18.11.2026).

1. /api/v1/devices/ is staff-only: a client must not list, read or change other clients' devices
   (the serializer exposes serial number, IMEI and the device password/PIN).
2. Registration must not take over a guest client profile before the e-mail is verified:
   anyone could register with a victim's e-mail and see their repairs, messages and PDFs.
"""
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

from apps.accounts.views.auth_views import _assign_guest_repairs_to_user
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


@pytest.mark.django_db
def test_guest_repairs_move_to_account_after_verification(api_client):
    repair = _guest_repair()

    with patch("apps.accounts.views.auth_views._send_verification_code", return_value=object()):
        api_client.post("/api/v1/accounts/register/", {
            "email": repair.client.email, "password": "Wlasciciel1234!", "first_name": "Anna",
            "last_name": "Nowak", "phone": "600100200",
        }, format="json")
    owner = User.objects.get(email=repair.client.email)
    owner.email_verified = True
    owner.save(update_fields=["email_verified"])

    _assign_guest_repairs_to_user(owner)  # what VerifyEmailView runs after a correct code

    repair.refresh_from_db()
    assert repair.client_id == owner.client_profile.id
    assert Client.objects.filter(email=owner.email, user__isnull=True).exists()  # old guest row kept, empty
