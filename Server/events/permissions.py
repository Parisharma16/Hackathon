"""Event-specific permissions."""

from rest_framework.permissions import BasePermission

from accounts.models import UserRole


class IsAdminOrOrganizer(BasePermission):
    """Allow access only to admin or organizer roles."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {UserRole.ADMIN, UserRole.ORGANIZER}
        )
