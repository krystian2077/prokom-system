"""Security fixes from audit AB4 (18.11.2026), findings T-04…T-19 in docs/bezpieczenstwo."""
from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token

from apps.accounts.models import LoginFailureLog, PasswordResetToken
from apps.repairs.services.public_submit import submit_repair_from_public_form

User = get_user_model()
STRONG = "Mocne-Haslo-2026!x"


def _user(email, role="client", verified=True, password=STRONG):
    return User.objects.create_user(email=email, password=password, role=role, email_verified=verified)


def _auth(api_client, user):
    token, _ = Token.objects.get_or_create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return token


def _guest_repair(email="gosc@example.com"):
    with patch("apps.communications.services.send.send_repair_submission_confirmation"):
        repair, _ = submit_repair_from_public_form(
            first_name="Anna", last_name="Nowak", email=email, phone="600100200",
            category="phone", problem_description="Pęknięty ekran",
        )
    return repair


# --- T-04, T-05, T-06: staff-only endpoints -------------------------------------------------

@pytest.mark.django_db
def test_client_cannot_send_messages_or_touch_offers(api_client):
    repair = _guest_repair()
    _auth(api_client, _user("klient@example.com"))
    assert api_client.post("/api/v1/communications/send/", {"template_id": 1, "repair_id": str(repair.id)},
                           format="json").status_code == 403
    for app in ("hammer-glass", "accessories"):
        assert api_client.get(f"/api/v1/{app}/repair-offers/").status_code == 403
        assert api_client.post(f"/api/v1/{app}/repair-offers/for-repair/{repair.id}/", {}, format="json").status_code == 403


@pytest.mark.django_db
def test_client_reads_but_cannot_write_brands_and_models(api_client):
    _auth(api_client, _user("klient@example.com"))
    assert api_client.get("/api/v1/devices/brands/").status_code == 200
    assert api_client.post("/api/v1/devices/brands/", {"name": "Zla Marka"}, format="json").status_code == 403
    assert api_client.post("/api/v1/devices/models/", {"name": "Zly Model"}, format="json").status_code == 403


@pytest.mark.django_db
def test_staff_still_sends_messages(api_client):
    _auth(api_client, _user("staff@example.com", role="staff"))
    # Missing template → 400/404 from the view itself, not 403 from permissions.
    response = api_client.post("/api/v1/communications/send/", {}, format="json")
    assert response.status_code != 403


# --- T-19: admin-only deletes and price list writes ----------------------------------------

@pytest.mark.django_db
def test_staff_cannot_delete_repairs_or_change_labour_prices(api_client):
    repair = _guest_repair()
    _auth(api_client, _user("staff@example.com", role="staff"))
    assert api_client.delete(f"/api/v1/repairs/{repair.id}/").status_code == 403
    assert api_client.get("/api/v1/pricing/labour-types/").status_code == 200
    assert api_client.post("/api/v1/pricing/labour-types/", {"name": "x"}, format="json").status_code == 403


@pytest.mark.django_db
def test_admin_can_delete_repairs(api_client):
    repair = _guest_repair()
    _auth(api_client, _user("admin@example.com", role="admin"))
    assert api_client.delete(f"/api/v1/repairs/{repair.id}/").status_code in (200, 204)


# --- decision 18.11: no client data before the e-mail is verified ---------------------------

@pytest.mark.django_db
def test_unverified_client_sees_no_repairs_until_verified(api_client):
    repair = _guest_repair("wlasciciel@example.com")
    user = _user("wlasciciel@example.com", verified=False)
    repair.client.user = user  # e.g. linked before AB2 — still hidden until verification
    repair.client.save(update_fields=["user"])
    _auth(api_client, user)

    listing = api_client.get("/api/v1/repairs/")
    data = listing.data.get("results", listing.data) if isinstance(listing.data, dict) else listing.data
    assert listing.status_code == 200 and len(data) == 0

    user.email_verified = True
    user.save(update_fields=["email_verified"])
    listing = api_client.get("/api/v1/repairs/")
    data = listing.data.get("results", listing.data) if isinstance(listing.data, dict) else listing.data
    assert {str(r["id"]) for r in data} == {str(repair.id)}


# --- T-07: expiring tokens, reset ends sessions ---------------------------------------------

@pytest.mark.django_db
def test_old_token_is_rejected(api_client):
    user = _user("klient@example.com")
    token = _auth(api_client, user)
    Token.objects.filter(pk=token.pk).update(created=timezone.now() - timedelta(hours=13))
    assert api_client.get("/api/v1/accounts/me/").status_code in (401, 403)
    assert not Token.objects.filter(user=user).exists()


@pytest.mark.django_db
def test_password_reset_deletes_token_and_other_links(api_client):
    user = _user("klient@example.com")
    Token.objects.create(user=user)
    first = PasswordResetToken.objects.create(user=user, token="a" * 43, expires_at=timezone.now() + timedelta(hours=1))
    PasswordResetToken.objects.create(user=user, token="b" * 43, expires_at=timezone.now() + timedelta(hours=1))
    response = api_client.post("/api/v1/accounts/reset-password/",
                               {"token": first.token, "new_password": "Nowe-Haslo-2026!q"}, format="json")
    assert response.status_code == 200, response.content
    assert not Token.objects.filter(user=user).exists()
    assert not PasswordResetToken.objects.filter(user=user).exists()


# --- T-14: temporary lock instead of deactivation -------------------------------------------

@pytest.mark.django_db
def test_many_failed_logins_lock_temporarily_without_deactivating(api_client):
    user = _user("admin@example.com", role="admin")
    LoginFailureLog.objects.bulk_create(
        [LoginFailureLog(ip_address=f"10.0.0.{i}", email_lower=user.email) for i in range(20)]
    )
    response = api_client.post("/api/v1/accounts/login/", {"email": user.email, "password": STRONG}, format="json")
    assert response.status_code == 429
    user.refresh_from_db()
    assert user.is_active


# --- T-15: password policy --------------------------------------------------------------------

@pytest.mark.django_db
def test_register_rejects_common_password(api_client):
    with patch("apps.accounts.views.auth_views._send_verification_code", return_value=object()):
        response = api_client.post("/api/v1/accounts/register/", {
            "email": "nowy@example.com", "password": "password123", "first_name": "Jan",
            "last_name": "Nowak", "phone": "600100200",
        }, format="json")
    assert response.status_code == 400
    assert not User.objects.filter(email="nowy@example.com").exists()


@pytest.mark.django_db
def test_change_password_rejects_numeric_password(api_client):
    _auth(api_client, _user("klient@example.com"))
    response = api_client.post("/api/v1/accounts/change-password/",
                               {"current_password": STRONG, "new_password": "12345678901"}, format="json")
    assert response.status_code == 400


# --- T-16: no account enumeration on resend ---------------------------------------------------

@pytest.mark.django_db
def test_resend_code_answers_the_same_for_unknown_and_verified(api_client):
    _user("zweryfikowany@example.com")
    a = api_client.post("/api/v1/accounts/resend-verification-code/", {"email": "nikt@example.com"}, format="json")
    b = api_client.post("/api/v1/accounts/resend-verification-code/", {"email": "zweryfikowany@example.com"}, format="json")
    assert a.status_code == b.status_code == 200
    assert set(a.data) == set(b.data) == {"email"}


# --- T-08: claim by SMS code switched off -----------------------------------------------------

@pytest.mark.django_db
def test_claim_by_code_is_switched_off(api_client):
    _auth(api_client, _user("klient@example.com"))
    assert api_client.post("/api/v1/repairs/request-claim-code/", {"repair_number": "X"}, format="json").status_code == 410
    assert api_client.post("/api/v1/repairs/confirm-claim-by-code/", {"repair_number": "X", "code": "123456"},
                           format="json").status_code == 410


# --- T-09: Google token must be issued to our client ------------------------------------------

def _google_response(status, payload):
    response = MagicMock(status_code=status)
    response.json.return_value = payload
    return response


@pytest.mark.django_db
def test_google_token_for_another_app_is_rejected(api_client, settings):
    settings.GOOGLE_CLIENT_ID = "nasz-klient.apps.googleusercontent.com"
    with patch("apps.accounts.views.google_auth_view.httpx.get",
               return_value=_google_response(200, {"aud": "inna-aplikacja", "azp": "inna-aplikacja"})):
        response = api_client.post("/api/v1/accounts/auth/google/", {"access_token": "t"}, format="json")
    assert response.status_code == 400
    assert not User.objects.exists()


@pytest.mark.django_db
def test_google_takes_over_unverified_account_safely(api_client, settings):
    settings.GOOGLE_CLIENT_ID = "nasz-klient.apps.googleusercontent.com"
    squatter = _user("ofiara@example.com", verified=False, password="Atak-Haslo-2026!z")
    Token.objects.create(user=squatter)
    responses = [
        _google_response(200, {"aud": settings.GOOGLE_CLIENT_ID}),
        _google_response(200, {"email": "ofiara@example.com", "email_verified": True,
                               "given_name": "Anna", "family_name": "Nowak"}),
    ]
    with patch("apps.accounts.views.google_auth_view.httpx.get", side_effect=responses):
        response = api_client.post("/api/v1/accounts/auth/google/", {"access_token": "t"}, format="json")
    assert response.status_code == 200, response.content
    squatter.refresh_from_db()
    assert squatter.email_verified
    assert not squatter.check_password("Atak-Haslo-2026!z")  # the pre-registered password is gone
    assert response.data["token"] != ""


# --- T-12: API docs not public ----------------------------------------------------------------

@pytest.mark.django_db
def test_api_schema_is_not_public(api_client):
    assert api_client.get("/api/schema/").status_code in (401, 403)
    _auth(api_client, _user("klient@example.com"))
    assert api_client.get("/api/schema/").status_code == 403


# --- review fixes: staff login lock (P1), fresh token at login (P2), direct profile reads (P3) ---

@pytest.mark.django_db
def test_staff_login_is_locked_too(api_client):
    staff = _user("pracownik@example.com", role="staff")
    LoginFailureLog.objects.bulk_create(
        [LoginFailureLog(ip_address=f"10.0.1.{i}", email_lower=staff.email) for i in range(20)]
    )
    response = api_client.post("/api/v1/accounts/staff-login/", {"email": staff.email, "password": STRONG}, format="json")
    assert response.status_code == 429


@pytest.mark.django_db
def test_login_replaces_an_expired_token(api_client):
    user = _user("klient@example.com")
    old = Token.objects.create(user=user)
    Token.objects.filter(pk=old.pk).update(created=timezone.now() - timedelta(hours=13))
    response = api_client.post("/api/v1/accounts/login/", {"email": user.email, "password": STRONG}, format="json")
    assert response.status_code == 200, response.content
    assert response.data["token"] != old.key
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
    assert api_client.get("/api/v1/accounts/me/").status_code == 200


@pytest.mark.django_db
def test_unverified_client_gets_no_profile_or_gdpr_data(api_client):
    _auth(api_client, _user("niezweryfikowany@example.com", verified=False))
    assert api_client.get("/api/v1/clients/me/").status_code == 404
    assert api_client.get("/api/v1/compliance/export-my-data/").status_code == 403
    assert api_client.post("/api/v1/compliance/request-account-deletion/", {}, format="json").status_code == 403


@pytest.mark.django_db
def test_api_docs_not_for_plain_staff(api_client):
    _auth(api_client, _user("staff@example.com", role="staff"))
    assert api_client.get("/api/schema/").status_code == 403
