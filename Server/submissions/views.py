"""Views for student submission upload and personal submission listing."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView

from common.responses import api_response
from submissions.models import Submission
from submissions.serializers import SubmissionCreateSerializer, SubmissionReadSerializer


class SubmissionCreateView(APIView):
    """Allow authenticated students to upload a new submission."""

    permission_classes = [IsAuthenticated]
    # MultiPartParser + FormParser are required to handle file uploads.
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = SubmissionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)

        # Owner is always the authenticated user; never trust the request body.
        submission = serializer.save(user=request.user)
        return api_response(
            True,
            "Submission uploaded successfully.",
            SubmissionReadSerializer(submission).data,
            201,
        )


class MySubmissionsView(APIView):
    """Return the authenticated user's own submission history."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        submissions = (
            Submission.objects.filter(user=request.user)
            .select_related("event")
            .order_by("-uploaded_at")
        )
        return api_response(
            True,
            "Submissions fetched.",
            SubmissionReadSerializer(submissions, many=True).data,
            200,
        )
