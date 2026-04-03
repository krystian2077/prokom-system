import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.compliance.models import ConfigAuditLog, FeatureFlag, SystemSetting


User = get_user_model()


@pytest.mark.django_db
def test_admin_can_list_system_center_seeded_data(api_client):
    admin = User.objects.create_user(email="admin-config@example.com", password="Pass1234!", role="admin", is_staff=True)
    api_client.force_authenticate(user=admin)

    settings_res = api_client.get(reverse("compliance-admin-system-settings"))
    flags_res = api_client.get(reverse("compliance-admin-feature-flags"))

    assert settings_res.status_code == 200
    assert flags_res.status_code == 200
    assert settings_res.data["count"] >= 1
    assert flags_res.data["count"] >= 1


@pytest.mark.django_db
def test_non_admin_cannot_access_system_center(api_client):
    staff = User.objects.create_user(email="staff-config@example.com", password="Pass1234!", role="staff")
    api_client.force_authenticate(user=staff)

    response = api_client.get(reverse("compliance-admin-system-settings"))

    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_can_bulk_update_setting_and_audit_log(api_client):
    admin = User.objects.create_user(email="admin-edit@example.com", password="Pass1234!", role="admin", is_staff=True)
    setting = SystemSetting.objects.create(
        key="operations.default_sla_hours",
        category="operations",
        label="Domyślny SLA",
        value_type="integer",
        value_json=24,
    )

    api_client.force_authenticate(user=admin)
    response = api_client.patch(
        reverse("compliance-admin-system-settings-bulk-update"),
        {
            "items": [
                {
                    "key": setting.key,
                    "value": 48,
                    "updated_at": setting.updated_at.isoformat(),
                }
            ]
        },
        format="json",
    )

    assert response.status_code == 200
    setting.refresh_from_db()
    assert setting.value_json == 48
    assert ConfigAuditLog.objects.filter(entity_type="setting", entity_key=setting.key).count() == 1


@pytest.mark.django_db
def test_admin_can_bulk_update_feature_flag(api_client):
    admin = User.objects.create_user(email="admin-flag@example.com", password="Pass1234!", role="admin", is_staff=True)
    flag = FeatureFlag.objects.create(
        key="premium.smart_assignments",
        name="Smart assignments",
        is_enabled=False,
        rollout_percentage=0,
    )

    api_client.force_authenticate(user=admin)
    response = api_client.patch(
        reverse("compliance-admin-feature-flags-bulk-update"),
        {
            "items": [
                {
                    "key": flag.key,
                    "is_enabled": True,
                    "rollout_percentage": 50,
                    "updated_at": flag.updated_at.isoformat(),
                }
            ]
        },
        format="json",
    )

    assert response.status_code == 200
    flag.refresh_from_db()
    assert flag.is_enabled is True
    assert flag.rollout_percentage == 50
    assert ConfigAuditLog.objects.filter(entity_type="feature_flag", entity_key=flag.key).count() == 1

