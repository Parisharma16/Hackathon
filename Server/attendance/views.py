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
        
        # event_id is already validated by serializer to exist
        event_id = serializer.validated_data["event_id"]
        roll_numbers = serializer.validated_data["roll_numbers"]
        
        event = Event.objects.get(id=event_id)
        
        # Use service to handle transaction-safe marking
        result = mark_attendance(event=event, roll_number_list=roll_numbers)
        
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
        serializer = AttendanceReadSerializer(attendances, many=True)
        return api_response(
            True, 
            "Attendance history fetched.", 
            serializer.data, 
            200
        )
