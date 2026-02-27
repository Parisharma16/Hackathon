"""Serializers for file submission creation and read operations."""

from rest_framework import serializers

from events.models import Event
from submissions.models import Submission


# File extensions permitted for uploads.
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
# Maximum upload size: 5 MB.
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


class SubmissionReadSerializer(serializers.ModelSerializer):
    """Read serializer for submission list and detail responses."""

    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "event",
            "event_title",
            "submission_type",
            "file_url",
            "status",
            "uploaded_at",
        ]


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for student submission uploads.

    Validates file type and size so that unsupported uploads never reach disk.
    """

    class Meta:
        model = Submission
        fields = [
            "event",
            "submission_type",
            "file_url",
        ]

    def validate_event(self, value):
        """Ensure the referenced event actually exists."""
        if not Event.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Event not found.")
        return value

    def validate_file_url(self, file_obj):
        """
        Reject files that do not match the allowed extensions or exceed the
        maximum upload size.
        """
        if file_obj is None:
            raise serializers.ValidationError("A file must be provided.")

        file_name: str = getattr(file_obj, "name", "") or ""
        extension = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        if extension not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file type '{extension}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}"
            )

        if file_obj.size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError(
                f"File size {file_obj.size} bytes exceeds the 5 MB limit."
            )

        return file_obj
