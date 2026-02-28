"""Attendance endpoint routes."""

from django.urls import path

from attendance.views import AttendanceMarkView, MyAttendanceView


urlpatterns = [
    path("mark/", AttendanceMarkView.as_view(), name="attendance-mark"),
    path("my/", MyAttendanceView.as_view(), name="attendance-my"),
]
