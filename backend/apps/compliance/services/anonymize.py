"""
GDPR art. 17 — anonymisation of a client account (audit T-18).

Repair records stay (accounting and warranty duties), but nothing in them
points to a person any more: identity, contact data, addresses, device
secrets, free-text notes, mail copies and login traces are wiped, the login
account is disabled. Guest profiles with the same e-mail go the same way.
"""
from rest_framework.authtoken.models import Token

from apps.accounts.models import (
    EmailVerificationAttempt,
    EmailVerificationCode,
    LoginActivity,
    LoginFailureLog,
    PasswordResetToken,
)
from apps.clients.models import Client, ClientAddress, ClientNote
from apps.communications.models import CommunicationLog
from apps.devices.models import Device
from apps.repairs.models import RepairNote, RepairRequest

ANON_FIRST_NAME = "Usunięty"
ANON_LAST_NAME = "Konto"


def _anonymize_one_client(client):
    client.first_name = ANON_FIRST_NAME
    client.last_name = ANON_LAST_NAME
    client.email = f"deleted-{client.id}@anon.local"
    for field in (
        "phone", "street", "city", "postal_code", "country", "internal_notes",
        "company_name", "nip", "contact_person", "company_email", "company_phone",
    ):
        if hasattr(client, field):
            setattr(client, field, "")
    client.user = None
    client.save()
    ClientAddress.objects.filter(client=client).delete()
    ClientNote.objects.filter(client=client).delete()
    # Device secrets and free-text notes; model/serial stay for repair history.
    Device.objects.filter(client=client).update(password="", notes="", imei="")
    repairs = RepairRequest.objects.filter(client=client)
    repairs.update(contact_phone="", client_notes="", package_notes="")
    RepairNote.objects.filter(repair__in=repairs, note_type=RepairNote.NOTE_TYPE_CLIENT_CONTACT).update(
        note="[usunięte na żądanie klienta]"
    )
    CommunicationLog.objects.filter(repair__in=repairs).update(recipient="", body_snapshot="")


def anonymize_client(client):
    """Anonymise the account's client profile and guest profiles sharing its e-mail."""
    old_email = (client.email or "").strip()
    _anonymize_one_client(client)
    if old_email:
        for guest in Client.objects.filter(email__iexact=old_email, user__isnull=True).exclude(pk=client.pk):
            _anonymize_one_client(guest)


def anonymize_user(user):
    old_email = (user.email or "").strip().lower()
    user.email = f"deleted-{user.pk}@anon.local"
    user.first_name = ""
    user.last_name = ""
    user.phone = ""
    user.is_active = False
    user.set_unusable_password()
    user.save(update_fields=["email", "first_name", "last_name", "phone", "is_active", "password"])
    EmailVerificationCode.objects.filter(user=user).delete()
    PasswordResetToken.objects.filter(user=user).delete()
    Token.objects.filter(user=user).delete()
    LoginActivity.objects.filter(user=user).delete()
    if old_email:
        EmailVerificationAttempt.objects.filter(email__iexact=old_email).delete()
        LoginFailureLog.objects.filter(email_lower=old_email).delete()
