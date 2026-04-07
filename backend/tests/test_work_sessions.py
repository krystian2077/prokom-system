import pytest
from datetime import datetime, time, timedelta
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.availability.enums import AvailabilityType
from apps.availability.models import EmployeeAvailability, WorkSession


@pytest.mark.django_db
def test_work_session_lifecycle(api_client):
    staff = User.objects.create_staffuser(
        email="worker-timesheet@example.com",
        password="secret123",
        first_name="Jan",
        last_name="Kowalski",
    )
    api_client.force_authenticate(user=staff)

    active_url = reverse("work-session-active")
    start_url = reverse("work-session-start")
    end_url = reverse("work-session-end")

    response = api_client.get(active_url)
    assert response.status_code == 200
    assert response.data["active_session"] is None

    response = api_client.post(start_url, format="json")
    assert response.status_code == 201
    assert response.data["detail"] == "Praca została rozpoczęta."
    assert response.data["active_session"]["is_open"] is True
    session_id = response.data["active_session"]["id"]

    response = api_client.post(start_url, format="json")
    assert response.status_code == 409
    assert response.data["active_session"]["id"] == session_id

    response = api_client.get(active_url)
    assert response.status_code == 200
    assert response.data["active_session"]["id"] == session_id

    response = api_client.post(end_url, format="json")
    assert response.status_code == 200
    assert response.data["detail"] == "Praca została zakończona."
    assert response.data["ended_session"]["is_open"] is False
    assert response.data["active_session"] is None

    session = WorkSession.objects.get(id=session_id)
    assert session.ended_at is not None
    assert session.duration_seconds is not None
    assert session.duration_seconds >= 0


@pytest.mark.django_db
def test_work_session_end_without_active_session(api_client):
    staff = User.objects.create_staffuser(
        email="worker-no-session@example.com",
        password="secret123",
        first_name="Anna",
        last_name="Nowak",
    )
    api_client.force_authenticate(user=staff)

    response = api_client.post(reverse("work-session-end"), format="json")

    assert response.status_code == 409
    assert response.data["detail"] == "Nie masz aktywnej pracy do zakończenia."
    assert WorkSession.objects.filter(employee=staff).count() == 0


@pytest.mark.django_db
def test_work_session_month_summary_returns_hours_and_absences(api_client):
    staff = User.objects.create_staffuser(
        email="worker-month-summary@example.com",
        password="secret123",
        first_name="Piotr",
        last_name="Lis",
    )
    api_client.force_authenticate(user=staff)

    now = timezone.now()
    month = now.strftime("%Y-%m")
    day_1 = timezone.localdate().replace(day=1)
    day_2 = day_1 + timedelta(days=1)

    WorkSession.objects.create(
        employee=staff,
        started_at=timezone.make_aware(datetime.combine(day_1, time(hour=8))),
        ended_at=timezone.make_aware(datetime.combine(day_1, time(hour=12))),
        duration_seconds=4 * 3600,
    )
    WorkSession.objects.create(
        employee=staff,
        started_at=timezone.make_aware(datetime.combine(day_2, time(hour=9))),
        ended_at=timezone.make_aware(datetime.combine(day_2, time(hour=17))),
        duration_seconds=8 * 3600,
    )

    EmployeeAvailability.objects.create(
        employee=staff,
        created_by=staff,
        availability_type=AvailabilityType.DAY_OFF,
        date=day_2,
        is_all_day=True,
    )

    response = api_client.get(f"{reverse('work-session-month-summary')}?month={month}")
    assert response.status_code == 200

    data = response.data
    assert data["month"] == month
    assert data["total_work_seconds"] == 12 * 3600
    assert data["worked_days_count"] == 2
    assert data["absence_days_count"] == 1
    assert len(data["worked_days"]) == 2
    assert len(data["absence_days"]) == 1
    assert data["absence_days"][0]["types"][0]["key"] == AvailabilityType.DAY_OFF


@pytest.mark.django_db
def test_work_session_month_summary_rejects_invalid_month(api_client):
    staff = User.objects.create_staffuser(
        email="worker-invalid-month@example.com",
        password="secret123",
        first_name="Jan",
        last_name="Nowy",
    )
    api_client.force_authenticate(user=staff)

    response = api_client.get(f"{reverse('work-session-month-summary')}?month=2026-13")
    assert response.status_code == 400
    assert "month" in response.data["detail"]


@pytest.mark.django_db
def test_admin_month_summary_returns_employees_with_details(api_client):
    admin = User.objects.create_user(
        email="admin-attendance@example.com",
        password="secret123",
        role="admin",
        is_staff=True,
    )
    staff = User.objects.create_staffuser(
        email="staff-attendance@example.com",
        password="secret123",
        first_name="Krzysztof",
        last_name="Nowak",
    )
    api_client.force_authenticate(user=admin)

    today = timezone.localdate()
    month = today.strftime("%Y-%m")
    WorkSession.objects.create(
        employee=staff,
        started_at=timezone.make_aware(datetime.combine(today, time(hour=8))),
        ended_at=timezone.make_aware(datetime.combine(today, time(hour=12))),
        duration_seconds=4 * 3600,
    )
    EmployeeAvailability.objects.create(
        employee=staff,
        created_by=admin,
        availability_type=AvailabilityType.DAY_OFF,
        date=today,
        is_all_day=True,
    )

    response = api_client.get(f"{reverse('admin-work-session-month-summary')}?month={month}")
    assert response.status_code == 200
    assert response.data["month"] == month
    employees = response.data["employees"]
    assert isinstance(employees, list)
    target = next((x for x in employees if x["employee_id"] == str(staff.id)), None)
    assert target is not None
    assert target["worked_days_count"] >= 1
    assert target["total_work_seconds"] >= 4 * 3600
    assert isinstance(target["worked_days"], list)
    assert isinstance(target["absence_days"], list)


@pytest.mark.django_db
def test_admin_month_summary_forbidden_for_staff(api_client):
    staff = User.objects.create_staffuser(
        email="staff-forbidden-attendance@example.com",
        password="secret123",
    )
    api_client.force_authenticate(user=staff)

    response = api_client.get(reverse("admin-work-session-month-summary"))
    assert response.status_code == 403


