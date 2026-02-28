"""Attendance model capturing event presence by student."""

import uuid
from django.conf import settings
from django.db import models

from events.models import Event


class Attendance(models.Model):
    """
    Attendance model aligned with the provided schema.

    The unique constraint on (user, event) prevents duplicate attendance for
    the same student in the same event.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendances")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="attendances")
    confidence = models.FloatField(null=True, blank=True)
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attendances"
        constraints = [
            models.UniqueConstraint(fields=["user", "event"], name="uniq_attendance_user_event"),
        ]
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.roll_no} @ {self.event.title}"
