"""
GDPR art. 17 — anonymisation of a client account (audit T-18).

Repair records stay (accounting and warranty duties), but nothing in them
points to a person any more: identity, contact data, addresses, device
secrets and internal notes are wiped, the login account is disabled.
"""
from apps.accounts.models import EmailVerificationCode, PasswordResetToken
from apps.clients.models import ClientAddress, ClientNote
from apps.devices.models import Device

ANON_FIRST_NAME = "Usunięty"
ANON_LAST_NAME = "Konto"


def anonymize_client(client):
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


def anonymize_user(user):
    user.email = f"deleted-{user.pk}@anon.local"
    user.first_name = ""
    user.last_name = ""
    user.phone = ""
    user.is_active = False
    user.set_unusable_password()
    user.save(update_fields=["email", "first_name", "last_name", "phone", "is_active", "password"])
    EmailVerificationCode.objects.filter(user=user).delete()
    PasswordResetToken.objects.filter(user=user).delete()
