from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import StaffProfile, User, UserRole
from apps.availability.enums import AvailabilityType
from apps.availability.models import EmployeeAvailability


@pytest.mark.django_db
def test_team_overview_returns_today_status_and_absence_ranges(api_client):
    admin = User.objects.create_user(
        email="admin-team@example.com",
        password="secret123",
        first_name="Anna",
        last_name="Admin",
        role=UserRole.ADMIN,
        is_staff=True,
    )
    staff = User.objects.create_staffuser(
        email="staff-team@example.com",
        password="secret123",
        first_name="Piotr",
        last_name="Pracownik",
    )
    StaffProfile.objects.create(user=staff, specialization="general")

    today = timezone.localdate()
    tomorrow = today + timedelta(days=1)

    EmployeeAvailability.objects.create(
        employee=staff,
        created_by=admin,
        availability_type=AvailabilityType.VACATION,
        date=today,
        is_all_day=True,
    )
    EmployeeAvailability.objects.create(
        employee=staff,
        created_by=admin,
        availability_type=AvailabilityType.VACATION,
        date=tomorrow,
        is_all_day=True,
    )

    api_client.force_authenticate(user=admin)
    response = api_client.get("/api/v1/accounts/staff/team-overview/")

    assert response.status_code == 200
    payload = response.json()
    rows = payload["results"]
    staff_row = next(row for row in rows if row["id"] == str(staff.id))

    assert staff_row["today_status"] == "off_today"
    assert staff_row["today_status_label"] == "Wolne"
    assert staff_row["planned_absence_ranges"][0]["start_date"] == str(today)
    assert staff_row["planned_absence_ranges"][0]["end_date"] == str(tomorrow)


@pytest.mark.django_db
def test_team_overview_forbidden_for_non_admin(api_client):
    client = User.objects.create_user(
        email="client-non-admin@example.com",
        password="secret123",
        first_name="Jan",
        last_name="Klient",
    )

    api_client.force_authenticate(user=client)
    response = api_client.get("/api/v1/accounts/staff/team-overview/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_team_overview_allowed_for_staff(api_client):
    User.objects.create_user(
        email="admin-hidden@example.com",
        password="secret123",
        first_name="Admin",
        last_name="Niewidoczny",
        role=UserRole.ADMIN,
        is_staff=True,
    )
    staff = User.objects.create_staffuser(
        email="staff-overview@example.com",
        password="secret123",
        first_name="Kasia",
        last_name="Serwis",
    )

    api_client.force_authenticate(user=staff)
    response = api_client.get("/api/v1/accounts/staff/team-overview/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["results"]
    assert all(row["role"] == UserRole.STAFF for row in payload["results"])


@pytest.mark.django_db
def test_staff_delete_soft_deactivates_account(api_client):
    admin = User.objects.create_user(
        email="admin-delete@example.com",
        password="secret123",
        first_name="Admin",
        last_name="Delete",
        role=UserRole.ADMIN,
        is_staff=True,
    )
    staff = User.objects.create_staffuser(
        email="staff-delete@example.com",
        password="secret123",
        first_name="Jan",
        last_name="Usuwany",
    )

    api_client.force_authenticate(user=admin)
    response = api_client.delete(f"/api/v1/accounts/staff/{staff.id}/")

    assert response.status_code == 200
    staff.refresh_from_db()
    assert staff.is_active is False

