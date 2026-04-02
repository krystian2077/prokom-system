import pytest
from datetime import date, datetime, time
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.calendar_app.models import TimeslotBlock
from apps.clients.models import Client
from apps.devices.models import Device
from apps.repairs.models import RepairVisitSchedule
from apps.repairs.services.repair_creation import create_repair_request


User = get_user_model()


def _make_repair(staff_user, suffix: str):
    client_obj = Client.objects.create(
        first_name=f"Klient{suffix}",
        last_name="Test",
        email=f"klient{suffix}@example.com",
        phone=f"5006007{suffix}",
    )
    device = Device.objects.create(client=client_obj, category="phone", model_name=f"Model {suffix}")
    return create_repair_request(
        client_id=client_obj.id,
        device_id=device.id,
        problem_description="Test kalendarza",
        assigned_to_id=staff_user.id,
    )


@pytest.mark.django_db
def test_admin_calendar_team_scope_returns_summary_and_workload(api_client):
    admin = User.objects.create_user(email="admin-cal@example.com", password="Pass1234!", role="admin", is_active=True)
    staff_a = User.objects.create_user(email="staff-a-cal@example.com", password="Pass1234!", role="staff", is_active=True)
    staff_b = User.objects.create_user(email="staff-b-cal@example.com", password="Pass1234!", role="staff", is_active=True)

    repair_a = _make_repair(staff_a, "101")
    repair_a.estimated_completion_date = date(2026, 4, 12)
    repair_a.staff_planned_work_date = date(2026, 4, 12)
    repair_a.ready_for_pickup_at = timezone.make_aware(datetime(2026, 4, 12, 11, 0, 0))
    repair_a.completed_at = timezone.make_aware(datetime(2026, 4, 12, 15, 0, 0))
    repair_a.save(update_fields=["estimated_completion_date", "staff_planned_work_date", "ready_for_pickup_at", "completed_at"])

    RepairVisitSchedule.objects.create(repair=repair_a, visit_date=date(2026, 4, 11), visit_time=time(10, 30))
    TimeslotBlock.objects.create(employee=staff_b, block_date=date(2026, 4, 12), start_time=time(8, 0), end_time=time(10, 0), reason="SLA")

    api_client.force_authenticate(user=admin)
    response = api_client.get("/api/v1/calendar/month/?from=2026-04-01&to=2026-04-30&scope=team")

    assert response.status_code == 200
    data = response.data
    assert "summary" in data
    assert data["summary"]["total_events"] >= 2
    assert "workload_by_employee" in data
    assert any(w["employee_id"] == str(staff_a.id) for w in data["workload_by_employee"])
    assert any(w["employee_id"] == str(staff_b.id) for w in data["workload_by_employee"])
    assert any(ev.get("employee_id") == str(staff_a.id) for ev in data["events"])


@pytest.mark.django_db
def test_staff_cannot_expand_scope_to_team(api_client):
    staff_a = User.objects.create_user(email="staff-scope-a@example.com", password="Pass1234!", role="staff", is_active=True)
    staff_b = User.objects.create_user(email="staff-scope-b@example.com", password="Pass1234!", role="staff", is_active=True)

    TimeslotBlock.objects.create(employee=staff_a, block_date=date(2026, 4, 9), start_time=time(9, 0), end_time=time(10, 0), reason="Moje")
    TimeslotBlock.objects.create(employee=staff_b, block_date=date(2026, 4, 9), start_time=time(11, 0), end_time=time(12, 0), reason="Cudze")

    api_client.force_authenticate(user=staff_a)
    response = api_client.get("/api/v1/calendar/month/?from=2026-04-01&to=2026-04-30&scope=team")

    assert response.status_code == 200
    employee_ids = {ev.get("employee_id") for ev in response.data["events"]}
    assert str(staff_a.id) in employee_ids
    assert str(staff_b.id) not in employee_ids


@pytest.mark.django_db
def test_admin_calendar_filters_by_category(api_client):
    admin = User.objects.create_user(email="admin-cat@example.com", password="Pass1234!", role="admin", is_active=True)
    staff = User.objects.create_user(email="staff-cat@example.com", password="Pass1234!", role="staff", is_active=True)

    repair = _make_repair(staff, "202")
    repair.estimated_completion_date = date(2026, 4, 15)
    repair.save(update_fields=["estimated_completion_date"])
    TimeslotBlock.objects.create(employee=staff, block_date=date(2026, 4, 15), start_time=time(8, 0), end_time=time(9, 0), reason="SLA")

    api_client.force_authenticate(user=admin)
    response = api_client.get("/api/v1/calendar/month/?from=2026-04-01&to=2026-04-30&scope=team&category=sla")

    assert response.status_code == 200
    assert response.data["events"]
    assert all(ev["category"] == "sla" for ev in response.data["events"])

