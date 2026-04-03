import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.tasks.models import Task


User = get_user_model()


@pytest.mark.django_db
def test_staff_list_contains_assigned_or_created_tasks(api_client):
    staff = User.objects.create_user(email="staff-tasks@example.com", password="Pass1234!", role="staff")
    admin = User.objects.create_user(email="admin-tasks@example.com", password="Pass1234!", role="admin", is_staff=True)
    other = User.objects.create_user(email="other-tasks@example.com", password="Pass1234!", role="staff")

    assigned_to_staff = Task.objects.create(title="Assigned", created_by=admin, assigned_to=staff)
    created_by_staff = Task.objects.create(title="Created by staff", created_by=staff, assigned_to=other)
    hidden_task = Task.objects.create(title="Hidden", created_by=admin, assigned_to=other)

    api_client.force_authenticate(user=staff)
    response = api_client.get(reverse("task-list"))

    assert response.status_code == 200
    rows = response.data if isinstance(response.data, list) else response.data.get("results", [])
    ids = {str(r["id"]) for r in rows}
    assert str(assigned_to_staff.id) in ids
    assert str(created_by_staff.id) in ids
    assert str(hidden_task.id) not in ids


@pytest.mark.django_db
def test_staff_can_create_for_other_user_and_delete_owned_task(api_client):
    staff = User.objects.create_user(email="staff-create@example.com", password="Pass1234!", role="staff")
    admin = User.objects.create_user(email="admin-create@example.com", password="Pass1234!", role="admin", is_staff=True)

    api_client.force_authenticate(user=staff)

    create_response = api_client.post(
        reverse("task-list"),
        {
            "title": "Task for admin",
            "priority": "standard",
            "status": "new",
            "assigned_to": str(admin.id),
        },
        format="json",
    )

    assert create_response.status_code == 201
    task_id = str(create_response.data["id"])

    detail_response = api_client.patch(
        reverse("task-detail", kwargs={"pk": task_id}),
        {"title": "Task for admin updated"},
        format="json",
    )
    assert detail_response.status_code == 200

    delete_response = api_client.delete(reverse("task-detail", kwargs={"pk": task_id}))
    assert delete_response.status_code == 204

