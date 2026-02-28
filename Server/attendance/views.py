"""Views for attendance marking and student attendance history."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from attendance.models import Attendance
from attendance.serializers import AttendanceMarkWriteSerializer, AttendanceReadSerializer
from attendance.services import mark_attendance
from common.responses import api_response
from events.models import Event
from events.permissions import IsAdminOrOrganizer


class AttendanceMarkView(APIView):
    """Allow organizer/admin to mark attendance by roll numbers."""

    permission_classes = [IsAuthenticated, IsAdminOrOrganizer]

    def post(self, request):
        serializer = AttendanceMarkWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)

        event = Event.objects.get(id=serializer.validated_data["event_id"])
        result = mark_attendance(event=event, roll_number_list=serializer.validated_data["roll_numbers"])
        return api_response(True, "Attendance processed successfully.", result, 200)


class MyAttendanceView(APIView):
    """Return authenticated user's attendance records."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        attendances = (
            Attendance.objects.filter(user=request.user)
            .select_related("event")
            .order_by("-marked_at")
        )
        return api_response(
            True,
            "Attendance history fetched.",
            AttendanceReadSerializer(attendances, many=True).data,
            200,
        )
