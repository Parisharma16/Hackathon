"""Submission model for certificate, CGPA, and paper uploads."""

import uuid

from django.conf import settings
from django.db import models


class SubmissionType(models.TextChoices):
    """Type of evidence being submitted."""

    CERTIFICATE = "certificate", "Certificate"
    CGPA = "cgpa", "CGPA"
    PAPER = "paper", "Paper"


class SubmissionStatus(models.TextChoices):
    """Review lifecycle state of a submission."""

    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class Submission(models.Model):
    """
    Standalone document verification submission.

    Not tied to any event. file_url stores the Supabase public URL returned
    after upload. event is kept nullable for schema compatibility.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions")
    # event is nullable because submissions are standalone document verifications,
    # not tied to a specific event.
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submissions",
    )
    submission_type = models.CharField(max_length=20, choices=SubmissionType.choices, db_index=True)
    # Stores the full Supabase public URL, e.g. https://xyz.supabase.co/storage/...
    file_url = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=SubmissionStatus.choices,
        default=SubmissionStatus.PENDING,
        db_index=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "submissions"
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.roll_no} - {self.submission_type} ({self.status})"
