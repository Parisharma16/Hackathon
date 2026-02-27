"""Top-level URL routing for the backend project."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("auth/", include("accounts.urls")),
    # SimpleJWT token refresh endpoint - used by frontend to renew expired access tokens.
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("events/", include("events.urls")),
    path("attendance/", include("attendance.urls")),
    path("submissions/", include("submissions.urls")),
    path("admin/submissions/", include("reviews.urls")),
    path("points/", include("points.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
