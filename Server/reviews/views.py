"""Views for admin submission management: list pending, approve, reject."""

from rest_framework.views import APIView

from accounts.permissions import IsAdmin
from common.responses import api_response
from points.services import approve_submission, reject_submission
from reviews.serializers import PendingSubmissionReadSerializer, ReviewActionSerializer
from submissions.models import Submission, SubmissionStatus


class PendingSubmissionsListView(APIView):
    """Return all submissions that are awaiting admin review."""

    permission_classes = [IsAdmin]

    def get(self, request):
        pending = (
            Submission.objects.filter(status=SubmissionStatus.PENDING)
            .select_related("user", "event")
            .order_by("uploaded_at")
        )
        return api_response(
            True,
            "Pending submissions fetched.",
            PendingSubmissionReadSerializer(pending, many=True).data,
            200,
        )


class ApproveSubmissionView(APIView):
    """Approve a pending submission and award points via the service layer."""

    permission_classes = [IsAdmin]

    def post(self, request, submission_id):
        try:
            submission = Submission.objects.select_related("user", "event").get(id=submission_id)
        except Submission.DoesNotExist:
            return api_response(False, "Submission not found.", None, 404)

        if submission.status != SubmissionStatus.PENDING:
            return api_response(False, "Submission is not in pending state.", None, 400)

        serializer = ReviewActionSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)

        # Delegate all DB writes and point awarding to the service.
        approve_submission(submission=submission, admin_user=request.user)
        return api_response(True, "Submission approved successfully.", None, 200)


class RejectSubmissionView(APIView):
    """Reject a pending submission with optional remarks."""

    permission_classes = [IsAdmin]

    def post(self, request, submission_id):
        try:
            submission = Submission.objects.select_related("user", "event").get(id=submission_id)
        except Submission.DoesNotExist:
            return api_response(False, "Submission not found.", None, 404)

        if submission.status != SubmissionStatus.PENDING:
            return api_response(False, "Submission is not in pending state.", None, 400)

        serializer = ReviewActionSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)

        reject_submission(
            submission=submission,
            admin_user=request.user,
            remarks=serializer.validated_data.get("remarks", ""),
        )
        return api_response(True, "Submission rejected.", None, 200)
