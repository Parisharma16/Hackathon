"""Submissions endpoint routes."""

from django.urls import path

from submissions.views import MySubmissionsView, SubmissionUploadView


urlpatterns = [
    path("upload/", SubmissionUploadView.as_view(), name="submissions-upload"),
    path("my/", MySubmissionsView.as_view(), name="submissions-my"),
]
