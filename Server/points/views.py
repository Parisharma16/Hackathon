"""Views for personal point history and leaderboard."""

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from accounts.models import User
from common.responses import api_response
from points.models import PointLedger
from points.serializers import LeaderboardEntrySerializer, PointLedgerReadSerializer


class MyPointsView(APIView):
    """Return the authenticated user's ledger entries and current total."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = (
            PointLedger.objects.filter(user=request.user)
            .select_related("event")
            .order_by("-created_at")
        )
        data = {
            "total_points": request.user.total_points,
            "ledger": PointLedgerReadSerializer(entries, many=True).data,
        }
        return api_response(True, "Points history fetched.", data, 200)


class LeaderboardView(APIView):
    """Return all students ranked by total points descending."""

    permission_classes = [AllowAny]

    def get(self, request):
        students = (
            User.objects.filter(role="student")
            .order_by("-total_points", "roll_no")
            .only("id", "roll_no", "name", "branch", "year", "total_points")
        )
        return api_response(
            True,
            "Leaderboard fetched.",
            LeaderboardEntrySerializer(students, many=True).data,
            200,
        )
