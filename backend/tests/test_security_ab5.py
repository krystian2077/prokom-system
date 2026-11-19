"""Audit AB5 — remaining findings T-18 and T-22."""
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

from apps.accounts.models import PasswordResetToken
from apps.accounts.services.email_verification import generate_and_send_verification_code
from apps.clients.models import Client, ClientAddress, ClientNote
from apps.compliance.models import GdprRequest
from apps.devices.models import Device
from apps.repairs.services.public_submit import submit_repair_from_public_form

User = get_user_model()
STRONG = "Mocne-Haslo-2026!x"
URL_DELETE = "/api/v1/compliance/request-account-deletion/"


def _client_with_repair(email="klient@example.com"):
    user = User.objects.create_user(email=email, password=STRONG, role="client", email_verified=True)
    with patch("apps.communications.services.send.send_repair_submission_confirmation"):
        repair, _ = submit_repair_from_public_form(
            first_name="Anna", last_name="Nowak", email=email, phone="600100200",
            category="phone", problem_description="Pęknięty ekran",
            street="Polna 1", city="Rabka-Zdrój", postal_code="34-700",
        )
    client = repair.client
    client.user = user
    client.save()
    Device.objects.filter(client=client).update(password="1234", notes="kod do sejfu", imei="490154203237518")
    ClientAddress.objects.create(client=client, label="Dom", street="Polna 1", city="Rabka", postal_code="34-700")
    ClientNote.objects.create(client=client, note="Dzwonić po 16")
    token, _ = Token.objects.get_or_create(user=user)
    return user, client, repair, token


@pytest.mark.django_db
def test_account_deletion_requires_password(api_client):
    user, _, _, token = _client_with_repair()
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    assert api_client.post(URL_DELETE, {}, format="json").status_code == 400
    assert api_client.post(URL_DELETE, {"password": "zle-haslo"}, format="json").status_code == 400
    user.refresh_from_db()
    assert user.is_active


@pytest.mark.django_db
def test_account_deletion_wipes_personal_data_but_keeps_repair(api_client):
    user, client, repair, token = _client_with_repair()
    PasswordResetToken.objects.create(user=user, token="x" * 64, expires_at=repair.created_at)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    assert api_client.post(URL_DELETE, {"password": STRONG}, format="json").status_code == 200

    user.refresh_from_db()
    client.refresh_from_db()
    assert not user.is_active and not user.has_usable_password()
    assert "klient@example.com" not in user.email and user.phone == "" and user.first_name == ""
    assert client.email.endswith("@anon.local") and client.phone == "" and client.street == ""
    assert client.user is None
    assert not ClientAddress.objects.filter(client=client).exists()
    assert not ClientNote.objects.filter(client=client).exists()
    device = Device.objects.filter(client=client).first()
    assert device is not None and device.password == "" and device.imei == "" and device.notes == ""
    assert not PasswordResetToken.objects.filter(user=user).exists()
    repair.refresh_from_db()
    assert repair.repair_number and repair.contact_phone == "" and repair.client_notes == ""
    assert GdprRequest.objects.get(client=client).status == "completed"
    assert not Token.objects.filter(user=user).exists()
    # A second request does nothing (account already gone).
    assert api_client.post(URL_DELETE, {"password": STRONG}, format="json").status_code in (401, 403)


@pytest.mark.django_db
def test_account_without_password_deletes_without_it_and_guest_profiles_go_too(api_client):
    user, client, _, token = _client_with_repair("google@example.com")
    user.set_unusable_password()
    user.save()
    guest = Client.objects.create(first_name="Anna", last_name="Nowak", email="google@example.com", phone="600100200")
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    assert api_client.post(URL_DELETE, {}, format="json").status_code == 200
    guest.refresh_from_db()
    assert guest.email.endswith("@anon.local") and guest.phone == ""


@pytest.mark.django_db
def test_inbound_webhook_rejects_wrong_secret(api_client, settings):
    settings.EMAIL_INBOUND_WEBHOOK_SECRET = "dobry-sekret"
    url = "/api/v1/communications/inbound-email/"
    r = api_client.post(url, {"from_email": "a@b.pl", "body": "x"}, format="json", HTTP_X_INBOUND_SECRET="zly")
    assert r.status_code == 401
    good = api_client.post(url, {"from_email": "a@b.pl", "body": "x"}, format="json", HTTP_X_INBOUND_SECRET="dobry-sekret")
    assert good.status_code != 401


@pytest.mark.django_db
def test_public_submit_hides_internal_errors(api_client):
    payload = {
        "client": {"first_name": "Jan", "last_name": "Kowalski", "email": "jan@example.com", "phone": "600100200"},
        "device": {
            "category": "phone", "problem_description": "Nie włącza się",
            "brand_name": "Apple", "model_name": "iPhone 12",
        },
    }
    with patch(
        "apps.repairs.views.public_submit_views.submit_repair_from_public_form",
        side_effect=RuntimeError("relation repairs_secret does not exist"),
    ) as service:
        r = api_client.post("/api/v1/repairs/submit/", payload, format="json")
    service.assert_called_once()
    assert r.status_code == 400
    assert "repairs_secret" not in str(r.data)
    assert r.data["detail"].startswith("Nie udało się przyjąć zgłoszenia")


@pytest.mark.django_db
def test_verification_code_is_six_digits():
    user = User.objects.create_user(email="otp@example.com", password=STRONG, role="client")
    with patch("apps.accounts.services.email_verification.send_email_html", return_value=True):
        v = generate_and_send_verification_code(user, log_send=False)
    assert v is not None and len(v.code) == 6 and v.code.isdigit()
