"""Admin registration for the attendance app."""

from django.contrib import admin

from attendance.models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ["user", "event", "confidence", "marked_at"]
    list_filter = ["event", "marked_at"]
    search_fields = ["user__roll_no", "user__email", "event__title"]
    readonly_fields = ["marked_at"]
    ordering = ["-marked_at"]
