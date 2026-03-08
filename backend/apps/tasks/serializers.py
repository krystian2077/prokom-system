"""Serializery zadań i komentarzy."""
from rest_framework import serializers
from .models import Task, TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = ["id", "task", "author", "author_name", "body", "created_at"]
        read_only_fields = ["id", "author", "created_at"]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.email
        return None

    def create(self, validated_data):
        task = self.context.get("task")
        author = self.context.get("request").user if self.context.get("request") else None
        return TaskComment.objects.create(task=task, author=author, **validated_data)


class TaskListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "title", "assigned_to", "assigned_to_name", "created_by", "created_by_name",
            "status", "status_display", "priority", "priority_display",
            "due_date", "completed_at", "is_overdue",
            "related_repair", "related_client", "related_customer_order", "related_store_order",
            "is_archived", "created_at", "updated_at", "comment_count",
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.email
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None

    def get_comment_count(self, obj):
        return getattr(obj, "comment_count", 0) or obj.comments.count()


class TaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "created_by", "created_by_name", "assigned_to", "assigned_to_name",
            "status", "status_display", "priority", "priority_display",
            "due_date", "completed_at", "is_overdue",
            "related_repair", "related_client", "related_customer_order", "related_store_order",
            "is_archived", "created_at", "updated_at", "comments",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.email
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """Do tworzenia i edycji — staff nie może zmieniać assigned_to (tylko admin)."""

    class Meta:
        model = Task
        fields = [
            "title", "description", "assigned_to", "status", "priority",
            "due_date", "related_repair", "related_client", "related_customer_order", "related_store_order",
            "is_archived",
        ]

    def validate_assigned_to(self, value):
        request = self.context.get("request")
        if not request or not self.instance:
            return value
        if getattr(request.user, "role", None) == "admin":
            return value
        current_id = self.instance.assigned_to_id
        new_id = value.id if value else None
        if new_id != current_id:
            raise serializers.ValidationError("Tylko administrator może przepisywać zadanie do innej osoby.")
        return value
