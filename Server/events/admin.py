"""Admin registration for the events app."""

from django.contrib import admin

from events.models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "type", "organized_by", "date", "points_per_participant", "winner_points", "created_by"]
    list_filter = ["type", "date"]
    search_fields = ["title", "organized_by"]
    readonly_fields = ["created_at"]
    ordering = ["-date"]
