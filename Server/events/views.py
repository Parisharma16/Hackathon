"""Views for event management and winner declaration."""

from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.responses import api_response
from events.models import Event
from events.permissions import IsAdminOrOrganizer
from events.serializers import EventCreateSerializer, EventReadSerializer, EventWinnersUpdateSerializer
from points.services import award_winner_points
from submissions.storage import upload_file_to_supabase


class EventCreateListView(APIView):
    """Handle event creation and public event listing."""

    def get_permissions(self):
        """Apply role restrictions only for creation while allowing public read."""
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdminOrOrganizer()]
        return [AllowAny()]

    def get(self, request):
        events = Event.objects.select_related("created_by").order_by("-date")
        return api_response(True, "Events fetched successfully.", EventReadSerializer(events, many=True).data, 200)

    def post(self, request):
        serializer = EventCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)
        event = serializer.save(created_by=request.user)
        return api_response(True, "Event created successfully.", EventReadSerializer(event).data, 201)


class EventDetailView(APIView):
    """
    Retrieve or update a single event by UUID.

    GET  /events/{id}/  — public, returns event detail.
    PATCH /events/{id}/ — organizer or admin only, partial update of event fields.
    """

    def get_permissions(self):
        """PATCH requires authentication; GET is public."""
        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsAdminOrOrganizer()]
        return [AllowAny()]

    def _get_event(self, event_id):
        """Fetch a single event with creator details or return None."""
        try:
            return Event.objects.select_related("created_by").get(id=event_id)
        except Event.DoesNotExist:
            return None

    def get(self, request, event_id):
        event = self._get_event(event_id)
        if event is None:
            return api_response(False, "Event not found.", None, 404)
        return api_response(True, "Event fetched successfully.", EventReadSerializer(event).data, 200)

    def patch(self, request, event_id):
        event = self._get_event(event_id)
        if event is None:
            return api_response(False, "Event not found.", None, 404)

        # partial=True allows any subset of fields to be updated.
        serializer = EventCreateSerializer(event, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)
        event = serializer.save()
        return api_response(True, "Event updated successfully.", EventReadSerializer(event).data, 200)


class EventBannerUploadView(APIView):
    """
    Upload an event banner image to Supabase Storage.

    POST /events/upload-banner/

    Returns the public Supabase URL without creating any database record.
    This URL is then passed as banner_url when creating or editing an event.
    Only image files (jpg, jpeg, png, webp) up to 5 MB are accepted.
    Requires organizer or admin role.
    """

    permission_classes = [IsAuthenticated, IsAdminOrOrganizer]
    parser_classes = [MultiPartParser, FormParser]

    _ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    _MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return api_response(False, "Validation failed.", {"file": ["This field is required."]}, 400)

        name: str = getattr(file_obj, "name", "") or ""
        extension = name.rsplit(".", 1)[-1].lower() if "." in name else ""

        if extension not in self._ALLOWED_EXTENSIONS:
            return api_response(
                False,
                "Validation failed.",
                {"file": [f"Unsupported file type '{extension}'. Allowed: {sorted(self._ALLOWED_EXTENSIONS)}"]},
                400,
            )

        if file_obj.size > self._MAX_SIZE_BYTES:
            return api_response(
                False,
                "Validation failed.",
                {"file": ["File size exceeds the 5 MB limit."]},
                400,
            )

        try:
            public_url = upload_file_to_supabase(file_obj=file_obj, submission_type="banner")
        except Exception as exc:
            return api_response(False, f"File upload failed: {exc}", None, 500)

        return api_response(True, "Banner uploaded successfully.", {"url": public_url}, 200)


class EventWinnersUpdateView(APIView):
    """Patch winner roll numbers and award winner points once."""

    permission_classes = [IsAuthenticated, IsAdminOrOrganizer]

    def patch(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return api_response(False, "Event not found.", None, 404)

        serializer = EventWinnersUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)

        event.winners_roll_nos = serializer.validated_data["winners_roll_nos"]
        event.save(update_fields=["winners_roll_nos"])
        award_winner_points(event)
        return api_response(True, "Winners updated successfully.", EventReadSerializer(event).data, 200)
