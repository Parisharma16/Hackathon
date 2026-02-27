"""Admin registration for the accounts app."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin for the platform User model.

    Extends Django's built-in UserAdmin to handle the removed username field
    and the addition of platform-specific fields.
    """

    ordering = ["email"]
    list_display = ["roll_no", "email", "name", "role", "year", "branch", "total_points", "is_staff"]
    list_filter = ["role", "is_staff", "is_active", "branch", "year"]
    search_fields = ["roll_no", "email", "name"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("roll_no", "name", "year", "branch")}),
        ("Platform", {"fields": ("role", "total_points")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
    readonly_fields = ["created_at", "updated_at", "total_points"]

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "roll_no", "name", "role", "year", "branch", "password1", "password2"),
        }),
    )
