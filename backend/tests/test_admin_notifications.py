import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.accounts.models import StaffNotification


User = get_user_model()


@pytest.mark.django_db
def test_admin_list_returns_notifications_for_all_workers(api_client):
    admin = User.objects.create_user(email="admin@example.com", password="Pass1234!", role="admin", is_staff=True)
    staff_a = User.objects.create_user(email="a@example.com", password="Pass1234!", role="staff")
    staff_b = User.objects.create_user(email="b@example.com", password="Pass1234!", role="staff")

    StaffNotification.objects.create(user=staff_a, notification_type="repair_assigned", title="A1", status="unread")
    StaffNotification.objects.create(user=staff_b, notification_type="part_arrived", title="B1", status="read")

    api_client.force_authenticate(user=admin)
    response = api_client.get(reverse("accounts:notifications-admin-list"), {"limit": 50})

    assert response.status_code == 200
    assert response.data["count"] >= 2
    emails = {row["user_email"] for row in response.data["results"]}
    assert "a@example.com" in emails
    assert "b@example.com" in emails


@pytest.mark.django_db
def test_staff_cannot_open_admin_notifications_endpoints(api_client):
    staff = User.objects.create_user(email="staff@example.com", password="Pass1234!", role="staff")
    api_client.force_authenticate(user=staff)

    response = api_client.get(reverse("accounts:notifications-admin-list"))

    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_can_mark_other_user_notification_as_read(api_client):
    admin = User.objects.create_user(email="admin2@example.com", password="Pass1234!", role="admin", is_staff=True)
    staff = User.objects.create_user(email="staff2@example.com", password="Pass1234!", role="staff")
    notif = StaffNotification.objects.create(
        user=staff,
        notification_type="repair_assigned",
        title="Nowe zgloszenie",
        status="unread",
    )

    api_client.force_authenticate(user=admin)
    response = api_client.patch(
        reverse("accounts:notifications-admin-detail", kwargs={"pk": notif.id}),
        {"status": "read"},
        format="json",
    )

    assert response.status_code == 200
    notif.refresh_from_db()
    assert notif.status == "read"

