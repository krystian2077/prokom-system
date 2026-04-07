import pytest
from django.contrib.auth import get_user_model

from apps.clients.models import Client
from apps.common.enums import RepairStatus
from apps.devices.models import Device
from apps.repairs.services import change_repair_status
from apps.repairs.services.repair_creation import create_repair_request


User = get_user_model()


@pytest.mark.django_db
def test_client_timeline_hides_internal_status_notes(api_client):
    staff = User.objects.create_user(email="staff-timeline@example.com", password="Pass1234!", role="staff")
    client_user = User.objects.create_user(email="client-timeline@example.com", password="Pass1234!", role="client")

    client_obj = Client.objects.create(
        user=client_user,
        first_name="Jan",
        last_name="Nowak",
        email="client-timeline@example.com",
        phone="500600721",
    )
    device = Device.objects.create(client=client_obj, category="phone", model_name="Galaxy S24")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Brak ładowania",
        assigned_to_id=staff.id,
    )
    change_repair_status(
        repair,
        new_status=RepairStatus.ACCEPTED,
        changed_by_id=staff.id,
        notes="Notatka wewnętrzna tylko dla serwisu",
        skip_transition_check=True,
    )

    api_client.force_authenticate(user=client_user)
    response = api_client.get(f"/api/v1/repairs/{repair.id}/timeline/")

    assert response.status_code == 200
    status_events = [
        ev for ev in response.data
        if ev.get("type") == "status_change" and ev.get("new_status") == RepairStatus.ACCEPTED
    ]
    assert status_events
    assert "notes" not in status_events[0]


@pytest.mark.django_db
def test_staff_timeline_still_shows_status_notes(api_client):
    staff = User.objects.create_user(email="staff2-timeline@example.com", password="Pass1234!", role="staff")
    client_obj = Client.objects.create(
        first_name="Anna",
        last_name="Kowal",
        email="client2-timeline@example.com",
        phone="500600722",
    )
    device = Device.objects.create(client=client_obj, category="phone", model_name="iPhone 15")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Szybko rozładowuje baterię",
        assigned_to_id=staff.id,
    )

    internal_note = "Notatka wewnętrzna dla zespołu"
    change_repair_status(
        repair,
        new_status=RepairStatus.ACCEPTED,
        changed_by_id=staff.id,
        notes=internal_note,
        skip_transition_check=True,
    )

    api_client.force_authenticate(user=staff)
    response = api_client.get(f"/api/v1/repairs/{repair.id}/timeline/")

    assert response.status_code == 200
    status_events = [
        ev for ev in response.data
        if ev.get("type") == "status_change" and ev.get("new_status") == RepairStatus.ACCEPTED
    ]
    assert status_events
    assert status_events[0].get("notes") == internal_note

