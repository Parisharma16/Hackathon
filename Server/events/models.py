"""Event-domain models for activities and declared winners."""

import uuid
from django.conf import settings
from django.db import models
from django.contrib.postgres.fields import ArrayField


class EventType(models.TextChoices):
    """Enumerated event types from the provided schema."""

    ACADEMIC = "academic", "Academic"
    COCURRICULAR = "cocurricular", "Co-curricular"
    EXTRACURRICULAR = "extracurricular", "Extra-curricular"


class Event(models.Model):
    """
    Event model aligned with the events schema.

    Winners are stored as a list of roll numbers to match the schema's
    `winners_roll_nos TEXT[]` design.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.TextField()
    type = models.CharField(max_length=20, choices=EventType.choices, db_index=True)
    organized_by = models.TextField()
    date = models.DateField(db_index=True)
    # Optional start time for the event. Stored as HH:MM:SS; null means TBD.
    time = models.TimeField(null=True, blank=True)
    location = models.TextField()
    points_per_participant = models.IntegerField()
    winner_points = models.IntegerField()
    winners_roll_nos = ArrayField(models.CharField(max_length=20), default=list, blank=True)
    # Supabase public URL uploaded directly by the client before creating the event.
    # Null by default — client uploads image to Supabase and passes the URL.
    banner_url = models.TextField(null=True, blank=True, default=None)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="events_created")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "events"
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.date})"
