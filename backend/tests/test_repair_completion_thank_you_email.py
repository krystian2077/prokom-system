import pytest
from django.contrib.auth import get_user_model

from apps.clients.models import Client
from apps.common.enums import RepairStatus
from apps.devices.models import Device
from apps.repairs.services import change_repair_status
from apps.repairs.services.repair_creation import create_repair_request
from apps.communications.services import send as send_service
from apps.communications.tasks import send_notification_for_repair_event


User = get_user_model()


@pytest.mark.django_db
def test_change_status_ready_for_pickup_sends_completion_thank_you_email(monkeypatch):
    admin = User.objects.create_user(
        email="admin-thanks@example.com",
        password="Pass1234!",
        role="admin",
        is_active=True,
    )
    client_obj = Client.objects.create(
        first_name="Anna",
        last_name="Nowak",
        email="anna.nowak@example.com",
        phone="500600701",
    )
    device = Device.objects.create(client=client_obj, category="phone", model_name="iPhone 15")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Wymiana baterii",
        assigned_to_id=admin.id,
    )

    calls = []

    monkeypatch.setattr(send_notification_for_repair_event, "delay", lambda *args, **kwargs: None)

    def _fake_send_thank_you(repair_obj, sent_by=None, fail_silently=True):
        calls.append((repair_obj.id, sent_by, fail_silently))
        return True, None

    monkeypatch.setattr(send_service, "send_repair_completion_thank_you_email", _fake_send_thank_you)

    change_repair_status(
        repair,
        new_status=RepairStatus.READY_FOR_PICKUP,
        changed_by_id=admin.id,
        notes="Naprawa zakonczona",
        skip_transition_check=True,
    )

    assert len(calls) == 1
    assert calls[0][0] == repair.id
    assert calls[0][1] is None


@pytest.mark.django_db
def test_change_status_other_than_ready_for_pickup_does_not_send_completion_email(monkeypatch):
    admin = User.objects.create_user(
        email="admin-no-thanks@example.com",
        password="Pass1234!",
        role="admin",
        is_active=True,
    )
    client_obj = Client.objects.create(
        first_name="Piotr",
        last_name="Kowalski",
        email="piotr.kowalski@example.com",
        phone="500600702",
    )
    device = Device.objects.create(client=client_obj, category="phone", model_name="Pixel 9")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Brak dzwieku",
        assigned_to_id=admin.id,
    )

    calls = []

    def _fake_send_thank_you(repair_obj, sent_by=None, fail_silently=True):
        calls.append(repair_obj.id)
        return True, None

    monkeypatch.setattr(send_service, "send_repair_completion_thank_you_email", _fake_send_thank_you)

    change_repair_status(
        repair,
        new_status=RepairStatus.ACCEPTED,
        changed_by_id=admin.id,
        notes="Przyjecie do serwisu",
        skip_transition_check=False,
    )

    assert calls == []

