"""Submission model for certificate, CGPA, and paper uploads."""

import uuid

from django.conf import settings
from django.db import models

from events.models import Event


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
    Submission model aligned with the provided schema.

    Files are stored at MEDIA_ROOT; file_url holds the relative path.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="submissions")
    submission_type = models.CharField(max_length=20, choices=SubmissionType.choices, db_index=True)
    file_url = models.FileField(upload_to="submissions/%Y/%m/")
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
            models.Index(fields=["event"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.roll_no} - {self.submission_type} ({self.status})"
