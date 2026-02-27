"""Submissions endpoint routes."""

from django.urls import path

from submissions.views import MySubmissionsView, SubmissionCreateView


urlpatterns = [
    path("", SubmissionCreateView.as_view(), name="submissions-create"),
    path("my/", MySubmissionsView.as_view(), name="submissions-my"),
]
