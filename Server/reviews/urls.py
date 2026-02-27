"""Admin review endpoint routes.

These paths are mounted at /admin/submissions/ in the root urlconf.
"""

from django.urls import path

from reviews.views import ApproveSubmissionView, PendingSubmissionsListView, RejectSubmissionView


urlpatterns = [
    path("pending/", PendingSubmissionsListView.as_view(), name="admin-submissions-pending"),
    path("<uuid:submission_id>/approve/", ApproveSubmissionView.as_view(), name="admin-submissions-approve"),
    path("<uuid:submission_id>/reject/", RejectSubmissionView.as_view(), name="admin-submissions-reject"),
]
