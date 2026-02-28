"""Event endpoint routes."""

from django.urls import path

from events.views import EventBannerUploadView, EventCreateListView, EventDetailView, EventWinnersUpdateView


urlpatterns = [
    path("", EventCreateListView.as_view(), name="events-list-create"),
    # upload-banner must come before <uuid:event_id>/ to avoid UUID matching "upload-banner"
    path("upload-banner/", EventBannerUploadView.as_view(), name="events-upload-banner"),
    path("<uuid:event_id>/", EventDetailView.as_view(), name="events-detail"),
    path("<uuid:event_id>/winners/", EventWinnersUpdateView.as_view(), name="events-update-winners"),
]
