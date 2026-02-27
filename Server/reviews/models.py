"""AdminReview model capturing approval/rejection decisions on submissions."""

import uuid

from django.conf import settings
from django.db import models

from submissions.models import Submission


class ReviewDecision(models.TextChoices):
    """Possible outcomes of an admin review."""

    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class AdminReview(models.Model):
    """
    Admin review record aligned with admin_reviews schema.

    Created once per submission decision; never updated.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reviews_given"
    )
    decision = models.CharField(max_length=20, choices=ReviewDecision.choices, db_index=True)
    remarks = models.TextField(blank=True, default="")
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "admin_reviews"
        indexes = [
            models.Index(fields=["decision"]),
            models.Index(fields=["submission"]),
        ]

    def __str__(self) -> str:
        return f"Review {self.decision} for submission {self.submission_id}"
