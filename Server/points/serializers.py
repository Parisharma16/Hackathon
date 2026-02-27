"""Serializers for point ledger reads and leaderboard output."""

from rest_framework import serializers

from accounts.models import User
from points.models import PointLedger


class PointLedgerReadSerializer(serializers.ModelSerializer):
    """Read serializer for a student's ledger entries."""

    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = PointLedger
        fields = [
            "id",
            "event",
            "event_title",
            "entry_type",
            "points",
            "reason",
            "source",
            "created_at",
        ]


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Compact serializer for leaderboard listing."""

    class Meta:
        model = User
        fields = [
            "id",
            "roll_no",
            "name",
            "branch",
            "year",
            "total_points",
        ]
