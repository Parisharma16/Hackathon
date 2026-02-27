"""Utility helpers for standardized API responses."""

from typing import Any

from rest_framework.response import Response


def api_response(success: bool, message: str, data: Any = None, status_code: int = 200) -> Response:
    """
    Return API responses in the uniform format required by the platform.

    Args:
        success: Indicates whether the operation succeeded.
        message: Human-readable status message.
        data: Optional payload.
        status_code: HTTP status code.
    """
    return Response(
        {
            "success": success,
            "message": message,
            "data": data,
        },
        status=status_code,
    )
