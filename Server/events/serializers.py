"""Serializers for event creation, listing, and winner updates."""

from rest_framework import serializers

from accounts.models import User
from events.models import Event


class EventCreatorSerializer(serializers.ModelSerializer):
    """Compact nested serializer for event creator details."""

    class Meta:
        model = User
        fields = ["id", "roll_no", "name", "email", "role"]


class EventReadSerializer(serializers.ModelSerializer):
    """Read serializer for event list responses."""

    created_by = EventCreatorSerializer()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "type",
            "organized_by",
            "date",
            "time",
            "location",
            "points_per_participant",
            "winner_points",
            "winners_roll_nos",
            "banner_url",
            "created_by",
            "created_at",
        ]


class EventCreateSerializer(serializers.ModelSerializer):
    """Write serializer for event creation."""

    # banner_url is optional — client uploads image to Supabase directly and
    # passes back the public URL. Empty string is stored if not provided.
    banner_url = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = Event
        fields = [
            "title",
            "type",
            "organized_by",
            "date",
            "time",
            "location",
            "points_per_participant",
            "winner_points",
            "banner_url",
        ]


class EventWinnersUpdateSerializer(serializers.Serializer):
    """Write serializer for winner roll number updates."""

    winners_roll_nos = serializers.ListField(
        child=serializers.CharField(max_length=20),
        allow_empty=True,
    )

    def validate_winners_roll_nos(self, value):
        """
        Normalize and deduplicate winner roll numbers while preserving order.
        """
        normalized: list[str] = []
        seen: set[str] = set()
        for roll in value:
            roll_norm = roll.strip()
            if not roll_norm:
                continue
            if roll_norm not in seen:
                seen.add(roll_norm)
                normalized.append(roll_norm)
        return normalized
