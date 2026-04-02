import pytest
from django.contrib.auth import get_user_model

from apps.clients.models import Client
from apps.common.enums import RepairStatus
from apps.devices.models import Device
from apps.repairs.services import change_repair_status
from apps.repairs.services.repair_creation import create_repair_request


User = get_user_model()


@pytest.mark.django_db
def test_admin_can_confirm_device_issue_from_pickup_panel(api_client):
    admin = User.objects.create_user(
        email="admin-pickup@example.com",
        password="Pass1234!",
        role="admin",
        is_active=True,
    )
    client_obj = Client.objects.create(
        first_name="Marek",
        last_name="Kowal",
        email="marek.pickup@example.com",
        phone="500600799",
    )
    device = Device.objects.create(client=client_obj, category="phone", model_name="Pixel 9")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Wymiana baterii",
        assigned_to_id=admin.id,
    )
    change_repair_status(
        repair,
        new_status=RepairStatus.READY_FOR_PICKUP,
        changed_by_id=admin.id,
        notes="Gotowe do odbioru",
        skip_transition_check=True,
    )

    api_client.force_authenticate(user=admin)
    response = api_client.post(
        f"/api/v1/repairs/{repair.id}/change-status/",
        {"new_status": RepairStatus.PICKED_UP, "notes": "Wydanie w panelu admina"},
        format="json",
    )

    assert response.status_code == 200
    repair.refresh_from_db()
    assert repair.status == RepairStatus.PICKED_UP
    assert repair.picked_up_at is not None

    panel = api_client.get("/api/v1/repairs/pickup-panel/")
    assert panel.status_code == 200
    ready_ids = {item["id"] for item in panel.data.get("ready_for_pickup", [])}
    issued_ids = {item["id"] for item in panel.data.get("issued_today", [])}
    assert str(repair.id) not in ready_ids
    assert str(repair.id) in issued_ids

