"""Custom permission classes for role and ownership checks."""

from rest_framework.permissions import BasePermission

from accounts.models import UserRole


class IsStudent(BasePermission):
    """Allow access only to users with student role."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.STUDENT)


class IsAdmin(BasePermission):
    """Allow access only to users with admin role."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN)


class IsOrganizer(BasePermission):
    """Allow access only to users with organizer role."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.ORGANIZER)


class IsOwner(BasePermission):
    """Allow access only when the object's `user` matches request user."""

    def has_object_permission(self, request, view, obj) -> bool:
        owner = getattr(obj, "user", None)
        return bool(request.user and request.user.is_authenticated and owner == request.user)
