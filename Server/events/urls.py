"""Event endpoint routes."""

from django.urls import path

from events.views import EventCreateListView, EventWinnersUpdateView


urlpatterns = [
    path("", EventCreateListView.as_view(), name="events-list-create"),
    path("<uuid:event_id>/winners/", EventWinnersUpdateView.as_view(), name="events-update-winners"),
]
