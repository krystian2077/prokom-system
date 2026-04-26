import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.accounts.models import StaffNotification


User = get_user_model()


@pytest.mark.django_db
def test_staff_notifications_list_returns_count_and_results(api_client):
    staff = User.objects.create_user(email="staff-list@example.com", password="Pass1234!", role="staff")
    other = User.objects.create_user(email="other-list@example.com", password="Pass1234!", role="staff")

    StaffNotification.objects.create(user=staff, notification_type="repair_assigned", title="Mine unread", status="unread")
    StaffNotification.objects.create(user=staff, notification_type="part_arrived", title="Mine read", status="read")
    StaffNotification.objects.create(user=other, notification_type="repair_assigned", title="Other", status="unread")

    api_client.force_authenticate(user=staff)
    response = api_client.get(reverse("accounts:notifications-list"), {"status": "unread", "limit": 500})

    assert response.status_code == 200
    assert isinstance(response.data, dict)
    assert response.data["count"] == 1
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["title"] == "Mine unread"


@pytest.mark.django_db
def test_staff_notification_detail_get_is_scoped_to_logged_user(api_client):
    staff = User.objects.create_user(email="staff-detail@example.com", password="Pass1234!", role="staff")
    other = User.objects.create_user(email="other-detail@example.com", password="Pass1234!", role="staff")

    mine = StaffNotification.objects.create(user=staff, notification_type="repair_assigned", title="Mine", status="unread")
    foreign = StaffNotification.objects.create(user=other, notification_type="repair_assigned", title="Foreign", status="unread")

    api_client.force_authenticate(user=staff)

    mine_response = api_client.get(reverse("accounts:notifications-detail", kwargs={"pk": mine.id}))
    foreign_response = api_client.get(reverse("accounts:notifications-detail", kwargs={"pk": foreign.id}))

    assert mine_response.status_code == 200
    assert mine_response.data["id"] == str(mine.id)
    assert foreign_response.status_code == 404

