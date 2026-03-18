"""Serializery checklisty pracownika dla konkretnej naprawy."""

from __future__ import annotations

from rest_framework import serializers

from apps.repairs.models import ChecklistRun, ChecklistRunItem


class ChecklistRunSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)
    started_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ChecklistRun
        fields = [
            "id",
            "template_name",
            "status",
            "started_at",
            "completed_at",
            "started_by_name",
        ]

    def get_started_by_name(self, obj: ChecklistRun) -> str | None:
        user = getattr(obj, "started_by", None)
        if not user:
            return None
        full = (user.get_full_name() or "").strip()
        return full or getattr(user, "email", None)


class ChecklistRunItemSerializer(serializers.ModelSerializer):
    template_item_label = serializers.CharField(source="template_item.label", read_only=True)
    item_type = serializers.CharField(source="template_item.item_type", read_only=True)
    checked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ChecklistRunItem
        fields = [
            "id",
            "template_item_label",
            "item_type",
            "result",
            "note",
            "checked_at",
            "checked_by_name",
        ]

    def get_checked_by_name(self, obj: ChecklistRunItem) -> str | None:
        user = getattr(obj, "checked_by", None)
        if not user:
            return None
        full = (user.get_full_name() or "").strip()
        return full or getattr(user, "email", None)


class ChecklistRunItemUpdateSerializer(serializers.Serializer):
    """
    PATCH /api/v1/repairs/<id>/checklist/item/

    payload:
    - item_id: int (ChecklistRunItem.id)
    - checked: boolean (dla checkbox)
    - result: string (opcjonalnie dla text/select)
    - note: string (opcjonalnie)
    """

    item_id = serializers.IntegerField()
    checked = serializers.BooleanField(required=False)
    result = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, allow_null=True)

