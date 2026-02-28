"""Admin registration for the points app."""

from django.contrib import admin

from points.models import Participation, PointLedger


@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = ["user", "event", "source", "verified", "created_at"]
    list_filter = ["source", "verified"]
    search_fields = ["user__roll_no", "event__title"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]


@admin.register(PointLedger)
class PointLedgerAdmin(admin.ModelAdmin):
    """
    Ledger rows are immutable by design. The admin interface is read-only to
    enforce that constraint even for superusers.
    """

    list_display = ["user", "event", "entry_type", "points", "source", "reason", "created_at"]
    list_filter = ["entry_type", "source"]
    search_fields = ["user__roll_no", "event__title"]
    readonly_fields = ["user", "event", "entry_type", "points", "source", "reason", "created_at"]
    ordering = ["-created_at"]

    def has_add_permission(self, request) -> bool:
        """Prevent manual ledger entry creation from admin."""
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        """Prevent ledger row deletion from admin."""
        return False
