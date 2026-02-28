"""Serializers for attendance write and read workflows."""

from rest_framework import serializers

from accounts.models import User
from attendance.models import Attendance
from events.models import Event


class AttendanceReadSerializer(serializers.ModelSerializer):
    """Read serializer for a student's attendance history."""

    event_title = serializers.CharField(source="event.title", read_only=True)
    event_date = serializers.DateField(source="event.date", read_only=True)
    event_type = serializers.CharField(source="event.type", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "event",
            "event_title",
            "event_date",
            "event_type",
            "marked_at",
        ]


class AttendanceMarkWriteSerializer(serializers.Serializer):
    """Write serializer for attendance marking via roll number list."""

    event_id = serializers.UUIDField()
    roll_numbers = serializers.ListField(
        child=serializers.CharField(max_length=20),
        allow_empty=False,
    )

    def validate_event_id(self, value):
        """Ensure target event exists."""
        if not Event.objects.filter(id=value).exists():
            raise serializers.ValidationError("Event does not exist.")
        return value

    def validate_roll_numbers(self, value):
        """
        Ensure all submitted roll numbers exist and normalize duplicates.
        """
        normalized: list[str] = []
        seen: set[str] = set()
        for roll in value:
            roll_no = roll.strip()
            if not roll_no:
                continue
            if roll_no not in seen:
                seen.add(roll_no)
                normalized.append(roll_no)

        if not normalized:
            raise serializers.ValidationError("At least one valid roll number is required.")

        existing_rolls = set(User.objects.filter(roll_no__in=normalized).values_list("roll_no", flat=True))
        missing = sorted(set(normalized) - existing_rolls)
        if missing:
            raise serializers.ValidationError(f"Unknown roll numbers: {missing}")

        return normalized
