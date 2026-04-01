import pytest
from django.contrib.auth import get_user_model

from apps.clients.models import Client
from apps.devices.models import Device
from apps.repairs.services.repair_creation import create_repair_request


User = get_user_model()


@pytest.mark.django_db
def test_admin_assign_requires_explicit_assignee(api_client):
    admin = User.objects.create_user(email="admin-assign@example.com", password="Pass1234!", role="admin", is_active=True)
    staff = User.objects.create_user(email="staff-assign@example.com", password="Pass1234!", role="staff", is_active=True)
    client_obj = Client.objects.create(first_name="Jan", last_name="Nowak", email="jan.assign@example.com", phone="500600710")
    device = Device.objects.create(client=client_obj, category="phone", model_name="Galaxy S24")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Brak obrazu",
        assigned_to_id=staff.id,
    )
    repair.assigned_to = None
    repair.save(update_fields=["assigned_to"])

    api_client.force_authenticate(user=admin)
    response = api_client.post(f"/api/v1/repairs/{repair.id}/assign/", {}, format="json")

    assert response.status_code == 400
    assert "musi wskaza" in str(response.data.get("detail", "")).lower()


@pytest.mark.django_db
def test_admin_cannot_assign_repair_to_self(api_client):
    admin = User.objects.create_user(email="admin-self@example.com", password="Pass1234!", role="admin", is_active=True)
    client_obj = Client.objects.create(first_name="Anna", last_name="Lis", email="anna.assign@example.com", phone="500600711")
    device = Device.objects.create(client=client_obj, category="phone", model_name="iPhone 13")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Nie ładuje",
    )

    api_client.force_authenticate(user=admin)
    response = api_client.post(
        f"/api/v1/repairs/{repair.id}/assign/",
        {"assigned_to_id": str(admin.id)},
        format="json",
    )

    assert response.status_code == 400
    assert "nie może przypisa" in str(response.data.get("detail", "")).lower()


@pytest.mark.django_db
def test_admin_can_assign_repair_to_staff(api_client):
    admin = User.objects.create_user(email="admin-ok@example.com", password="Pass1234!", role="admin", is_active=True)
    staff = User.objects.create_user(email="staff-ok@example.com", password="Pass1234!", role="staff", is_active=True)
    client_obj = Client.objects.create(first_name="Piotr", last_name="Kot", email="piotr.assign@example.com", phone="500600712")
    device = Device.objects.create(client=client_obj, category="tablet", model_name="iPad")
    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Pęknięty ekran",
    )

    api_client.force_authenticate(user=admin)
    response = api_client.post(
        f"/api/v1/repairs/{repair.id}/assign/",
        {"assigned_to_id": str(staff.id)},
        format="json",
    )

    assert response.status_code == 200
    repair.refresh_from_db()
    assert repair.assigned_to_id == staff.id

