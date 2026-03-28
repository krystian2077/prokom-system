"""Testy podsumowania części na dashboard (selektor + endpoint)."""
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.enums import RepairStatus
from apps.clients.models import Client
from apps.devices.models import Device
from apps.inventory.models import Part, PartUsage
from apps.inventory.models.part_usage import PartOrderStatus, PartUsageStatus
from apps.inventory.selectors import parts_status_dashboard
from apps.repairs.services.repair_creation import create_repair_request

User = get_user_model()


class PartsStatusDashboardSelectorTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email="staff-pd@example.com",
            password="TestPass123!",
            role="staff",
        )
        self.staff_other = User.objects.create_user(
            email="staff2-pd@example.com",
            password="TestPass123!",
            role="staff",
        )
        self.admin = User.objects.create_user(
            email="admin-pd@example.com",
            password="TestPass123!",
            role="admin",
        )
        self.client_obj = Client.objects.create(
            first_name="Jan",
            last_name="Kowalski",
            email="client-pd@example.com",
            phone="500600700",
        )
        self.device = Device.objects.create(
            client=self.client_obj,
            category="phone",
            model_name="Test Phone",
        )
        self.repair = create_repair_request(
            client_id=self.client_obj.id,
            device_id=self.device.id,
            problem_description="test",
            assigned_to_id=self.staff.id,
        )
        self.repair.status = RepairStatus.IN_REPAIR
        self.repair.save(update_fields=["status"])

        self.part = Part.objects.create(name="Bateria test", code="BAT-1")

        self.usage_to_order = PartUsage.objects.create(
            repair=self.repair,
            part=self.part,
            quantity=Decimal("1"),
            unit_price_used=Decimal("50.00"),
            usage_status=PartUsageStatus.ORDERED,
            order_status=PartOrderStatus.TO_ORDER,
        )
        self.usage_in_transit = PartUsage.objects.create(
            repair=self.repair,
            part=self.part,
            quantity=Decimal("1"),
            unit_price_used=Decimal("60.00"),
            usage_status=PartUsageStatus.ORDERED,
            order_status=PartOrderStatus.ORDERED,
        )
        self.usage_arrived = PartUsage.objects.create(
            repair=self.repair,
            part=self.part,
            quantity=Decimal("1"),
            unit_price_used=Decimal("70.00"),
            usage_status=PartUsageStatus.ARRIVED,
            order_status=PartOrderStatus.ARRIVED,
        )

    def test_buckets_count_and_staff_scope(self):
        data = parts_status_dashboard(user_id=self.staff.id, scope_all_repairs=False)
        self.assertEqual(data["to_order"].count(), 1)
        self.assertEqual(data["in_transit"].count(), 1)
        self.assertEqual(data["arrived"].count(), 1)

        other_repair = create_repair_request(
            client_id=self.client_obj.id,
            device_id=self.device.id,
            problem_description="other",
            assigned_to_id=self.staff_other.id,
        )
        other_repair.status = RepairStatus.IN_REPAIR
        other_repair.save(update_fields=["status"])
        PartUsage.objects.create(
            repair=other_repair,
            part=self.part,
            quantity=Decimal("1"),
            unit_price_used=Decimal("10.00"),
            usage_status=PartUsageStatus.ORDERED,
            order_status=PartOrderStatus.TO_ORDER,
        )

        staff_only = parts_status_dashboard(user_id=self.staff.id, scope_all_repairs=False)
        self.assertEqual(staff_only["to_order"].count(), 1)

        admin_all = parts_status_dashboard(user_id=self.admin.id, scope_all_repairs=True)
        self.assertEqual(admin_all["to_order"].count(), 2)


class PartsDashboardSummaryAPITests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.staff = User.objects.create_user(
            email="staff-api@example.com",
            password="TestPass123!",
            role="staff",
        )
        self.client_obj = Client.objects.create(
            first_name="Ewa",
            last_name="Nowak",
            email="client-api@example.com",
            phone="500600701",
        )
        self.device = Device.objects.create(
            client=self.client_obj,
            category="phone",
            model_name="API Phone",
        )
        self.repair = create_repair_request(
            client_id=self.client_obj.id,
            device_id=self.device.id,
            problem_description="api",
            assigned_to_id=self.staff.id,
        )
        self.repair.status = RepairStatus.IN_REPAIR
        self.repair.save(update_fields=["status"])
        self.part = Part.objects.create(name="Szyba", code="GL-1")
        PartUsage.objects.create(
            repair=self.repair,
            part=self.part,
            quantity=Decimal("1"),
            unit_price_used=Decimal("40.00"),
            usage_status=PartUsageStatus.ORDERED,
            order_status=PartOrderStatus.TO_ORDER,
        )

    def test_get_summary_returns_json(self):
        self.api.force_authenticate(user=self.staff)
        url = "/api/v1/inventory/parts-dashboard-summary/"
        res = self.api.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertIn("to_order", res.data)
        self.assertIn("in_transit", res.data)
        self.assertIn("arrived", res.data)
        self.assertEqual(res.data["to_order"]["count"], 1)
        self.assertGreaterEqual(len(res.data["to_order"]["items"]), 1)

    def test_summary_includes_expected_arrival_date(self):
        u = PartUsage.objects.filter(repair=self.repair).first()
        u.expected_arrival_date = date(2026, 4, 15)
        u.save(update_fields=["expected_arrival_date"])
        self.api.force_authenticate(user=self.staff)
        res = self.api.get("/api/v1/inventory/parts-dashboard-summary/")
        self.assertEqual(res.status_code, 200)
        item = res.data["to_order"]["items"][0]
        self.assertEqual(item.get("expected_arrival_date"), "2026-04-15")
