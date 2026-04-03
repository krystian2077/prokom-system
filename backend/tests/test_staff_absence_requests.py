from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.availability.enums import AvailabilityType
from apps.availability.models import EmployeeAvailability, EmployeeAbsenceRequest


@pytest.mark.django_db
def test_staff_can_create_absence_request_and_admin_can_approve_it(api_client):
    staff = User.objects.create_staffuser(
        email="staff-absence@example.com",
        password="secret123",
        first_name="Kasia",
        last_name="Pracownik",
    )
    admin = User.objects.create_user(
        email="admin-absence@example.com",
        password="secret123",
        first_name="Anna",
        last_name="Admin",
        role=UserRole.ADMIN,
        is_staff=True,
    )

    today = timezone.localdate()
    end_date = today + timedelta(days=2)

    api_client.force_authenticate(user=staff)
    response = api_client.post(
        "/api/v1/availability/requests/",
        {
            "availability_type": AvailabilityType.VACATION,
            "start_date": str(today),
            "end_date": str(end_date),
            "note": "Planowany urlop",
        },
        format="json",
    )

    assert response.status_code == 201
    request_id = response.json()["id"]
    absence_request = EmployeeAbsenceRequest.objects.get(pk=request_id)
    assert absence_request.status == "pending"
    assert absence_request.employee_id == staff.id

    api_client.force_authenticate(user=admin)
    approve_response = api_client.post(
        f"/api/v1/availability/requests/{request_id}/approve/",
        {"review_note": "Zatwierdzam"},
        format="json",
    )

    assert approve_response.status_code == 200
    absence_request.refresh_from_db()
    assert absence_request.status == "approved"
    assert absence_request.reviewed_by_id == admin.id

    approved_entries = EmployeeAvailability.objects.filter(
        employee=staff,
        availability_type=AvailabilityType.VACATION,
        date__gte=today,
        date__lte=end_date,
        is_active=True,
    )
    assert approved_entries.count() == 3


@pytest.mark.django_db
def test_staff_can_view_only_own_absence_requests(api_client):
    staff_a = User.objects.create_staffuser(
        email="staff-a-absence@example.com",
        password="secret123",
        first_name="A",
        last_name="One",
    )
    staff_b = User.objects.create_staffuser(
        email="staff-b-absence@example.com",
        password="secret123",
        first_name="B",
        last_name="Two",
    )

    today = timezone.localdate()
    EmployeeAbsenceRequest.objects.create(
        employee=staff_a,
        availability_type=AvailabilityType.DAY_OFF,
        start_date=today,
        end_date=today,
        note="Własne zgłoszenie",
    )
    EmployeeAbsenceRequest.objects.create(
        employee=staff_b,
        availability_type=AvailabilityType.VACATION,
        start_date=today,
        end_date=today,
        note="Cudze zgłoszenie",
    )

    api_client.force_authenticate(user=staff_a)
    response = api_client.get("/api/v1/availability/requests/")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["employee"] == str(staff_a.id)

