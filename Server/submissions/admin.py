"""Admin registration for the submissions app."""

from django.contrib import admin

from submissions.models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["user", "event", "submission_type", "status", "uploaded_at"]
    list_filter = ["submission_type", "status", "uploaded_at"]
    search_fields = ["user__roll_no", "user__email", "event__title"]
    readonly_fields = ["uploaded_at"]
    ordering = ["-uploaded_at"]
