"""Views for the Supabase-backed submission upload and student history."""

from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.responses import api_response
from submissions.models import Submission
from submissions.serializers import SubmissionReadSerializer, SubmissionUploadSerializer
from submissions.storage import upload_file_to_supabase


class SubmissionUploadView(APIView):
    """
    Single upload endpoint.

    Accepts a file and submission_type, uploads the file to Supabase Storage,
    and saves the returned public URL as a pending Submission row.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = SubmissionUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)

        file_obj = serializer.validated_data["file"]
        submission_type = serializer.validated_data["submission_type"]

        # Upload to Supabase and retrieve the public URL.
        try:
            public_url = upload_file_to_supabase(
                file_obj=file_obj,
                submission_type=submission_type,
            )
        except Exception as exc:
            return api_response(False, f"File upload failed: {exc}", None, 500)

        # Persist metadata. Owner is always the authenticated user.
        submission = Submission.objects.create(
            user=request.user,
            submission_type=submission_type,
            file_url=public_url,
        )

        return api_response(
            True,
            "Submission uploaded successfully.",
            SubmissionReadSerializer(submission).data,
            201,
        )


class MySubmissionsView(APIView):
    """Return all submissions belonging to the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        submissions = (
            Submission.objects.filter(user=request.user)
            .order_by("-uploaded_at")
        )
        return api_response(
            True,
            "Submissions fetched.",
            SubmissionReadSerializer(submissions, many=True).data,
            200,
        )
