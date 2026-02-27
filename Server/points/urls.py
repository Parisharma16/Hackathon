"""Points endpoint routes."""

from django.urls import path

from points.views import LeaderboardView, MyPointsView


urlpatterns = [
    path("my/", MyPointsView.as_view(), name="points-my"),
    path("leaderboard/", LeaderboardView.as_view(), name="points-leaderboard"),
]
