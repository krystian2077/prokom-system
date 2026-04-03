import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.availability.enums import AvailabilityType
from apps.availability.models import EmployeeAvailability


User = get_user_model()


@pytest.mark.django_db
def test_staff_login_allows_staff_user(api_client):
    user = User.objects.create_user(
        email="staff@example.com",
        password="Pass1234!",
        role="staff",
        is_active=True,
    )

    url = reverse("accounts:staff-login")
    response = api_client.post(url, {"email": user.email, "password": "Pass1234!"}, format="json")

    assert response.status_code == 200
    assert "token" in response.data
    assert response.data["user"]["email"] == user.email
    assert response.data["user"]["role"] == "staff"

    today = timezone.localdate()
    assert EmployeeAvailability.objects.filter(
        employee=user,
        date=today,
        is_active=True,
        availability_type=AvailabilityType.AVAILABLE,
    ).exists()


@pytest.mark.django_db
def test_staff_login_rejects_client_user(api_client):
    user = User.objects.create_user(
        email="client@example.com",
        password="Pass1234!",
        role="client",
        is_active=True,
    )

    url = reverse("accounts:staff-login")
    response = api_client.post(url, {"email": user.email, "password": "Pass1234!"}, format="json")

    # Dla klienta udajemy zwykłą złą parę login/hasło
    assert response.status_code == 400
    assert "token" not in response.data


@pytest.mark.django_db
def test_staff_login_does_not_override_existing_absence_today(api_client):
    user = User.objects.create_user(
        email="staff-absence@example.com",
        password="Pass1234!",
        role="staff",
        is_active=True,
    )
    today = timezone.localdate()
    EmployeeAvailability.objects.create(
        employee=user,
        created_by=user,
        availability_type=AvailabilityType.DAY_OFF,
        date=today,
        is_all_day=True,
    )

    url = reverse("accounts:staff-login")
    response = api_client.post(url, {"email": user.email, "password": "Pass1234!"}, format="json")

    assert response.status_code == 200
    assert not EmployeeAvailability.objects.filter(
        employee=user,
        date=today,
        is_active=True,
        availability_type=AvailabilityType.AVAILABLE,
    ).exists()


