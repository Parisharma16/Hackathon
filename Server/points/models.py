"""
Points-domain models: participation records, immutable point ledger.

These two tables are always written together inside a transaction to keep the
ledger and participation data consistent.
"""

import uuid

from django.conf import settings
from django.db import models

from events.models import Event


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

    The unique constraint prevents double-recording the same source for the
    same (user, event) pair.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="participations")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="participations")
    source = models.CharField(max_length=20, choices=ParticipationSource.choices, db_index=True)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "participations"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "event", "source"],
                name="uniq_participation_user_event_source",
            ),
        ]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["event"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.roll_no} - {self.event.title} ({self.source})"


class PointLedger(models.Model):
    """
    Immutable point ledger.

    Rows are NEVER updated or deleted after insertion.  Total points are always
    derived by summing ledger rows via update_user_total_points().
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ledger_entries")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="ledger_entries")
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
