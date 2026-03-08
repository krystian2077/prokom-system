"""Widoki API części (katalog + magazyn)."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.inventory.models import Part
from apps.inventory.serializers import (
    PartSerializer,
    PartListSerializer,
    PartCreateUpdateSerializer,
    SupplierListSerializer,
)
from apps.inventory.selectors import part_autocomplete, part_detail_card_stats, parts_queue


class PartViewSet(viewsets.ModelViewSet):
    """CRUD katalogu części. Filtry: device_category, brand, part_type, quality_variant. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    queryset = Part.objects.select_related("supplier").order_by("name")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "is_active", "supplier", "category",
        "device_category", "brand", "part_type", "quality_variant",
    ]
    search_fields = [
        "name", "code", "category",
        "device_model_name", "brand", "part_type", "quality_variant",
    ]
    ordering_fields = ["name", "code", "sell_price", "quantity_in_stock", "created_at", "device_model_name"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return PartCreateUpdateSerializer
        if self.action == "list":
            return PartListSerializer
        return PartSerializer

    @action(detail=False, url_path="autocomplete")
    def autocomplete(self, request):
        """
        GET /api/v1/inventory/parts/autocomplete/?q=...&repair_id=...&device_category=...&brand=...
        Podpowiedzi części (do dodania do naprawy). Opcjonalnie kontekst naprawy.
        """
        q = (request.query_params.get("q") or "").strip()
        repair_id = request.query_params.get("repair_id")
        device_category = request.query_params.get("device_category")
        brand = request.query_params.get("brand")
        limit = min(int(request.query_params.get("limit", 20)), 50)
        if repair_id and not device_category:
            from apps.repairs.models import RepairRequest
            repair = RepairRequest.objects.filter(id=repair_id).select_related("device").first()
            if repair and repair.device:
                device_category = getattr(repair.device, "category", None) or ""
                if getattr(repair.device, "brand", None):
                    brand = repair.device.brand.name
                elif getattr(repair.device, "manual_brand", None):
                    brand = repair.device.manual_brand
        parts = part_autocomplete(q, repair_id=repair_id, device_category=device_category, brand=brand, limit=limit)
        return Response(PartListSerializer(parts, many=True).data)

    @action(detail=True, url_path="card")
    def card(self, request, pk=None):
        """
        GET /api/v1/inventory/parts/<id>/card/
        Karta szczegółów części: dane + historia użycia, ostatnia hurtownia, ceny (ostatnia/średnia/min/max), ostatnie naprawy.
        """
        part = self.get_object()
        stats = part_detail_card_stats(part.id)
        part_data = PartSerializer(part).data
        last_supplier = stats.get("last_supplier")
        most_used_supplier_id = stats.get("most_used_supplier_id")
        most_used_supplier = None
        if most_used_supplier_id:
            from apps.inventory.models import Supplier
            most_used_supplier = Supplier.objects.filter(id=most_used_supplier_id).first()
        recent_usages = stats["recent_usages"]
        repair_ids = [u["repair_id"] for u in recent_usages if u.get("repair_id")]
        repair_numbers = {}
        if repair_ids:
            from apps.repairs.models import RepairRequest
            for r in RepairRequest.objects.filter(id__in=repair_ids).values("id", "repair_number"):
                repair_numbers[r["id"]] = r["repair_number"]
        recent_repairs = [
            {
                "usage_id": u["id"],
                "repair_id": u["repair_id"],
                "repair_number": repair_numbers.get(u["repair_id"]),
                "created_at": u["created_at"],
                "usage_status": u["usage_status"],
                "purchase_cost": str(u["purchase_cost"]) if u.get("purchase_cost") is not None else None,
            }
            for u in recent_usages
        ]
        return Response({
            "part": part_data,
            "usage_count": stats["usage_count"],
            "last_used_at": stats["last_used_at"].isoformat() if stats["last_used_at"] else None,
            "last_supplier": SupplierListSerializer(last_supplier).data if last_supplier else None,
            "last_purchase_cost": str(stats["last_purchase_cost"]) if stats["last_purchase_cost"] is not None else None,
            "most_used_supplier": SupplierListSerializer(most_used_supplier).data if most_used_supplier else None,
            "avg_purchase_cost": str(stats["avg_purchase_cost"]) if stats["avg_purchase_cost"] is not None else None,
            "min_purchase_cost": str(stats["min_purchase_cost"]) if stats["min_purchase_cost"] is not None else None,
            "max_purchase_cost": str(stats["max_purchase_cost"]) if stats["max_purchase_cost"] is not None else None,
            "recent_repairs": recent_repairs,
        })
