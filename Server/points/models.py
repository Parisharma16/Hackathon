"""
Points-domain models: participation records, immutable point ledger.

These two tables are always written together inside a transaction to keep the
ledger and participation data consistent.
"""

import uuid

from django.conf import settings
from django.db import models


class ParticipationSource(models.TextChoices):
    """Valid sources that trigger a participation record."""

    ATTENDANCE = "attendance", "Attendance"
    SUBMISSION = "submission", "Submission"


class LedgerEntryType(models.TextChoices):
    """Credit or debit direction for a ledger row."""

    CREDIT = "credit", "Credit"
    DEBIT = "debit", "Debit"


class LedgerSource(models.TextChoices):
    """Business source that generated the ledger entry."""

    ATTENDANCE = "attendance", "Attendance"
    WINNER = "winner", "Winner"
    CERTIFICATE = "certificate", "Certificate"
    CGPA = "cgpa", "CGPA"
    PAPER = "paper", "Paper"


class Participation(models.Model):
    """
    Participation record created when a student either attends or gets a
    submission approved.

    event is nullable because submission-based participations are not tied to
    an event. The unique constraint uses source only when event is null.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="participations")
    # Nullable: attendance participations have an event, submission approvals do not.
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="participations",
    )
    source = models.CharField(max_length=20, choices=ParticipationSource.choices, db_index=True)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "participations"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["event"]),
        ]

    def __str__(self) -> str:
        event_label = self.event.title if self.event_id else "standalone"
        return f"{self.user.roll_no} - {event_label} ({self.source})"


class PointLedger(models.Model):
    """
    Immutable point ledger.

    Rows are NEVER updated or deleted after insertion. Total points are always
    derived by summing ledger rows via update_user_total_points().

    event is nullable because submission-based awards are not tied to an event.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ledger_entries")
    # Nullable: attendance/winner entries have an event, submission approvals do not.
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    entry_type = models.CharField(max_length=10, choices=LedgerEntryType.choices)
    points = models.IntegerField()
    reason = models.TextField()
    source = models.CharField(max_length=20, choices=LedgerSource.choices, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "point_ledger"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["event"]),
            models.Index(fields=["source"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.roll_no} +{self.points} ({self.source})"
