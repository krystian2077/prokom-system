"""Serializery dla RepairNote."""
from rest_framework import serializers
from ..models import RepairNote


class RepairNoteSerializer(serializers.ModelSerializer):
    """Notatka do naprawy (wewnętrzna lub publiczna)."""

    class Meta:
        model = RepairNote
        fields = [
            "id",
            "repair",
            "author",
            "note",
            "is_internal",
            "is_important",
            "note_type",
            "pinned",
            "created_at",
        ]
        read_only_fields = ["id", "author", "created_at"]
