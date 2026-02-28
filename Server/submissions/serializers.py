"""Serializers for the Supabase-backed submission upload workflow."""

from rest_framework import serializers
from submissions.models import Submission


# File extensions permitted for uploads.
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
# Maximum upload size: 5 MB.
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


class SubmissionReadSerializer(serializers.ModelSerializer):
    """Read serializer for submission list and detail responses."""

    class Meta:
        model = Submission
        fields = [
            "id",
            "submission_type",
            "file_url",
            "status",
            "uploaded_at",
        ]


class SubmissionUploadSerializer(serializers.Serializer):
    """
    Write serializer for the upload endpoint.

    Validates submission_type and the uploaded file before the view passes the
    file to the Supabase storage service.
    """

    submission_type = serializers.ChoiceField(
        choices=["certificate", "cgpa", "paper"]
    )
    file = serializers.FileField()

    def validate_file(self, file_obj):
        """Reject unsupported file types and oversized files."""
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
