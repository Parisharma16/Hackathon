"""Admin registration for the submissions app."""

from django.contrib import admin

from submissions.models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["user", "submission_type", "status", "uploaded_at"]
    list_filter = ["submission_type", "status", "uploaded_at"]
    search_fields = ["user__roll_no", "user__email"]
    readonly_fields = ["uploaded_at", "file_url"]
    ordering = ["-uploaded_at"]
