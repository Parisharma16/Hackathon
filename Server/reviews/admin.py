"""Admin registration for the reviews app."""

from django.contrib import admin

from reviews.models import AdminReview


@admin.register(AdminReview)
class AdminReviewAdmin(admin.ModelAdmin):
    list_display = ["submission", "reviewer", "decision", "reviewed_at"]
    list_filter = ["decision", "reviewed_at"]
    search_fields = ["submission__user__roll_no", "reviewer__email"]
    readonly_fields = ["reviewed_at"]
    ordering = ["-reviewed_at"]
