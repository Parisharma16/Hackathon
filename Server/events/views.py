"""Views for event management and winner declaration."""

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.responses import api_response
from events.models import Event
from events.permissions import IsAdminOrOrganizer
from events.serializers import EventCreateSerializer, EventReadSerializer, EventWinnersUpdateSerializer
from points.services import award_winner_points


class EventCreateListView(APIView):
    """Handle event creation and public event listing."""

    def get_permissions(self):
        """
        Apply role restrictions only for creation while allowing public read.
        """
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
