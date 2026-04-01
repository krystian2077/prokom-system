import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.accounts.models import StaffNotification


User = get_user_model()


@pytest.mark.django_db
def test_admin_unread_count_is_global(api_client):
    admin = User.objects.create_user(email="admin-count@example.com", password="Pass1234!", role="admin", is_staff=True)
    staff_a = User.objects.create_user(email="staff-a@example.com", password="Pass1234!", role="staff")
    staff_b = User.objects.create_user(email="staff-b@example.com", password="Pass1234!", role="staff")

    StaffNotification.objects.create(user=staff_a, notification_type="repair_assigned", title="N1", status="unread")
    StaffNotification.objects.create(user=staff_b, notification_type="part_arrived", title="N2", status="unread")
    StaffNotification.objects.create(user=staff_b, notification_type="part_arrived", title="N3", status="read")

    api_client.force_authenticate(user=admin)
    response = api_client.get(reverse("accounts:notifications-unread-count"))

    assert response.status_code == 200
    assert response.data["count"] == 2


@pytest.mark.django_db
def test_staff_unread_count_stays_personal(api_client):
    staff = User.objects.create_user(email="staff-count@example.com", password="Pass1234!", role="staff")
    other = User.objects.create_user(email="other@example.com", password="Pass1234!", role="staff")

    StaffNotification.objects.create(user=staff, notification_type="repair_assigned", title="Mine", status="unread")
    StaffNotification.objects.create(user=other, notification_type="repair_assigned", title="Other", status="unread")

    api_client.force_authenticate(user=staff)
    response = api_client.get(reverse("accounts:notifications-unread-count"))

    assert response.status_code == 200
    assert response.data["count"] == 1

