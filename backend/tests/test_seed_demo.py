"""Tests for `manage.py seed_demo` (demo data for staff-panel screenshots, staging only)."""
from io import StringIO
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework.test import APIClient

from apps.accounts.models import StaffNotification
from apps.availability.models import WorkSession
from apps.clients.models import Client
from apps.common.management.commands import seed_demo
from apps.common.management.commands.seed_demo import DEMO_USER_EMAIL, REGISTRY_KEY, detect_environment
from apps.compliance.models import SystemSetting
from apps.devices.models import Device
from apps.repairs.models import RepairRequest
from apps.tasks.models import Task

User = get_user_model()
SQLITE = "django.db.backends.sqlite3"
PG = "django.db.backends.postgresql"


def run(*args):
    out = StringIO()
    call_command("seed_demo", *args, stdout=out)
    return out.getvalue()


def demo_repairs():
    return RepairRequest.objects.filter(internal_notes__startswith="[DEMO]")


# --- environment guard -------------------------------------------------------
@pytest.mark.parametrize(
    "engine,name,hosts",
    [
        (PG, "prokom_tech_prod", ["prokomserwis.pl"]),
        (PG, "prokom_tech_prod", ["localhost"]),
        (PG, "prokom_db", ["localhost"]),
        (PG, "prokom_tech_staging", ["staging.prokomserwis.pl", "www.prokomserwis.pl"]),
        (PG, "something_else", ["staging.prokomserwis.pl"]),
        (SQLITE, "db.sqlite3", ["prokomserwis.pl"]),
        (PG, "prokom_tech_staging", ["*"]),
    ],
)
def test_detect_environment_refuses_production_or_unknown(engine, name, hosts):
    with pytest.raises(CommandError):
        detect_environment(engine, name, hosts)


def test_detect_environment_accepts_staging_and_local():
    assert detect_environment(PG, "prokom_tech_staging", ["staging.prokomserwis.pl", "backend"]) == "staging"
    assert detect_environment(SQLITE, "db.sqlite3", ["localhost", "testserver"]) == "local"


@pytest.mark.django_db
def test_command_refuses_on_production_and_writes_nothing():
    with mock.patch.object(seed_demo, "current_db_info", return_value=(PG, "prokom_tech_prod", ["prokomserwis.pl"])):
        with pytest.raises(CommandError):
            run("--yes-staging")
    assert not User.objects.filter(email=DEMO_USER_EMAIL).exists()
    assert not demo_repairs().exists()


# --- dry run -------------------------------------------------------------------
@pytest.mark.django_db
def test_dry_run_writes_nothing():
    counts_before = (RepairRequest.objects.count(), Client.objects.count(), User.objects.count())
    out = run()
    assert "DRY RUN" in out
    assert (RepairRequest.objects.count(), Client.objects.count(), User.objects.count()) == counts_before
    assert not SystemSetting.objects.filter(key=REGISTRY_KEY).exists()


# --- seeding -------------------------------------------------------------------
@pytest.mark.django_db
def test_seed_creates_demo_data_without_sending_anything():
    mail.outbox = []
    with mock.patch("celery.app.task.Task.apply_async") as real_enqueue:
        out = run("--yes-staging")
    assert mail.outbox == []
    real_enqueue.assert_not_called()

    user = User.objects.get(email=DEMO_USER_EMAIL)
    assert user.role == "staff"
    assert demo_repairs().count() == 10
    assert demo_repairs().filter(assigned_to__isnull=True).count() == 1
    assert demo_repairs().filter(assigned_to=user).count() == 9
    assert all(r.repair_number.startswith("PROKOM/RMA/") for r in demo_repairs())
    assert Task.objects.filter(assigned_to=user).count() == 3
    assert StaffNotification.objects.filter(user=user, status=StaffNotification.UNREAD).count() == 2
    assert not WorkSession.objects.filter(employee=user).exists()
    assert "Aktywnych: 7" in out
    assert "hasło:" in out


@pytest.mark.django_db
def test_seed_is_idempotent():
    run("--yes-staging")
    run("--yes-staging")
    assert demo_repairs().count() == 10
    assert User.objects.filter(email=DEMO_USER_EMAIL).count() == 1
    assert Client.objects.filter(email__startswith="demo.", internal_notes__startswith="[DEMO]").count() == 10


@pytest.mark.django_db
def test_dashboard_shows_demo_counts():
    run("--yes-staging")
    api = APIClient()
    api.force_authenticate(User.objects.get(email=DEMO_USER_EMAIL))
    res = api.get("/api/v1/staff/dashboard/")
    assert res.status_code == 200
    data = res.json()
    assert data["my_active_count"] == 7
    assert data["in_repair_kpi_count"] == 5
    assert len(data["ready_for_pickup"]) == 1
    assert len(data["today_to_contact"]) == 1

    user_id = User.objects.get(email=DEMO_USER_EMAIL).id
    todo = api.get(f"/api/v1/repairs/special-views/requires-action/?assigned_to={user_id}")
    assert todo.status_code == 200 and len(todo.json()) == 7  # „Co teraz robić?”
    tasks = api.get("/api/v1/tasks/dashboard-preview/")
    assert tasks.status_code == 200 and len(tasks.json()) == 3  # „Moje zadania”
    comms = api.get("/api/v1/repairs/dashboard-comms-preview/?limit=20")
    assert comms.status_code == 200 and len(comms.json()["items"]) == 3  # wiadomości od klientów


# --- clear -----------------------------------------------------------------------
@pytest.mark.django_db
def test_clear_removes_only_demo_data():
    other_staff = User.objects.create_user(email="real-staff@example.com", password="x-Pass-123!", role="staff")
    real_client = Client.objects.create(first_name="TEST AUDYT", last_name="Klient", email="audyt@example.com", phone="+48 600 700 800")
    look_alike = Client.objects.create(  # demo-like e-mail, but no [DEMO] marker → must survive
        first_name="Ola", last_name="Nowak", email="demo.ola@example.com", phone="+48 600 700 801"
    )
    device = Device.objects.create(client=real_client, category="phone", manual_brand="Apple", manual_model="iPhone 12")
    real_repair = RepairRequest.objects.create(
        client=real_client, device=device, problem_description="TEST AUDYT — nie ruszać",
        internal_notes="TEST AUDYT", assigned_to=other_staff,
    )

    run("--yes-staging")
    assert demo_repairs().count() == 10
    out = run("--clear", "--yes-staging")
    assert "TEST AUDYT" in out  # reported, not touched

    assert not demo_repairs().exists()
    assert not User.objects.filter(email=DEMO_USER_EMAIL).exists()
    assert not SystemSetting.objects.filter(key=REGISTRY_KEY).exists()
    assert RepairRequest.objects.filter(pk=real_repair.pk).exists()
    assert Client.objects.filter(pk__in=[real_client.pk, look_alike.pk]).count() == 2
    assert User.objects.filter(pk=other_staff.pk).exists()


@pytest.mark.django_db
def test_clear_without_flag_is_dry_run():
    run("--yes-staging")
    run("--clear")
    assert demo_repairs().count() == 10
