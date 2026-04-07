import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import StaffNotification, StaffProfile, StaffSpecialization
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


@pytest.mark.django_db
def test_create_repair_with_assigned_staff_creates_notification():
    staff = User.objects.create_user(email="staff-intake@example.com", password="Pass1234!", role="staff", is_active=True)
    admin = User.objects.create_user(email="admin-intake@example.com", password="Pass1234!", role="admin", is_active=True)
    client_obj = Client.objects.create(first_name="Jan", last_name="Nowak", email="jan.intake@example.com", phone="500600700")
    device = Device.objects.create(client=client_obj, category="phone", model_name="Pixel 8")

    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Nie dziala ekran",
        assigned_to_id=staff.id,
    )

    # Pracownik powinien dostać powiadomienie o przypisaniu
    staff_notif = StaffNotification.objects.filter(user=staff, repair=repair, notification_type="repair_assigned").first()
    assert staff_notif is not None
    assert "przypisana do ciebie" in staff_notif.title.lower()

    # Admin powinien dostać powiadomienie o nowej naprawie
    admin_notif = StaffNotification.objects.filter(user=admin, repair=repair, notification_type="repair_assigned").first()
    assert admin_notif is not None
    assert "przyjęta" in admin_notif.title.lower()


@pytest.mark.django_db
def test_create_repair_auto_assignment_creates_notification_for_suggested_staff():
    staff = User.objects.create_user(email="staff-auto-intake@example.com", password="Pass1234!", role="staff", is_active=True)
    admin = User.objects.create_user(email="admin-auto@example.com", password="Pass1234!", role="admin", is_active=True)
    StaffProfile.objects.create(user=staff, specialization=StaffSpecialization.PHONE_TABLET, is_available=True)
    client_obj = Client.objects.create(first_name="Anna", last_name="Kowalska", email="anna.intake@example.com", phone="500600701")
    device = Device.objects.create(client=client_obj, category="phone", model_name="iPhone 15")

    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Szybko rozladowuje baterie",
    )

    repair.refresh_from_db()
    assert repair.assigned_to_id == staff.id

    # Pracownik powinien dostać powiadomienie
    assert StaffNotification.objects.filter(
        user=staff,
        repair=repair,
        notification_type="repair_assigned",
    ).exists()

    # Admin też powinien dostać powiadomienie
    assert StaffNotification.objects.filter(
        user=admin,
        repair=repair,
        notification_type="repair_assigned",
    ).exists()


@pytest.mark.django_db
def test_create_repair_without_assignment_does_not_create_notification():
    admin = User.objects.create_user(email="admin-no-assign@example.com", password="Pass1234!", role="admin", is_active=True)
    client_obj = Client.objects.create(first_name="Piotr", last_name="Lis", email="piotr.intake@example.com", phone="500600702")
    device = Device.objects.create(client=client_obj, category="laptop", model_name="ThinkPad")

    repair = create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Nie uruchamia sie",
        skip_auto_assign=True,
    )

    assert repair.assigned_to_id is None

    # Admini powinni dostać powiadomienie o nowej naprawie (zawsze)
    assert StaffNotification.objects.filter(
        user=admin,
        repair=repair,
        notification_type="repair_assigned"
    ).exists()
