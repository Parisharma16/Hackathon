"""Serializers for admin review reads and approval/rejection writes."""

from rest_framework import serializers

from reviews.models import AdminReview
from submissions.models import Submission
from submissions.serializers import SubmissionReadSerializer


class AdminReviewReadSerializer(serializers.ModelSerializer):
    """Read serializer for review history entries."""

    class Meta:
        model = AdminReview
        fields = [
            "id",
            "submission",
            "reviewer",
            "decision",
            "remarks",
            "reviewed_at",
        ]


class PendingSubmissionReadSerializer(SubmissionReadSerializer):
    """
    Extends SubmissionReadSerializer with submitter details for admin views.
    """

    submitter_roll_no = serializers.CharField(source="user.roll_no", read_only=True)
    submitter_name = serializers.CharField(source="user.name", read_only=True)

    class Meta(SubmissionReadSerializer.Meta):
        fields = SubmissionReadSerializer.Meta.fields + ["submitter_roll_no", "submitter_name"]


class ApproveActionSerializer(serializers.Serializer):
    """
    Write serializer for the approve action.

    points is required and entered by the admin at review time (Option B).
    remarks is optional.
    """

    points = serializers.IntegerField(min_value=1)
    remarks = serializers.CharField(required=False, allow_blank=True, default="")


class RejectActionSerializer(serializers.Serializer):
    """Write serializer for the reject action with optional remarks."""

    remarks = serializers.CharField(required=False, allow_blank=True, default="")
