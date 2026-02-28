"""Views for auth endpoints using JWT tokens."""

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import LoginSerializer, ProfileUpdateSerializer, RegisterSerializer, UserReadSerializer
from common.responses import api_response


class RegisterView(APIView):
    """Register a new user account and return created user data."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)
        user = serializer.save()
        return api_response(True, "User registered successfully.", UserReadSerializer(user).data, 201)


class LoginView(APIView):
    """Authenticate credentials and return JWT token pair."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return api_response(False, "Invalid credentials.", serializer.errors, 400)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserReadSerializer(user).data,
        }
        return api_response(True, "Login successful.", data, 200)


class MeView(APIView):
    """
    GET  /auth/me/ — return the authenticated user's profile.
    PATCH /auth/me/ — update mutable profile fields (name, year, branch, profile_pic).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return api_response(True, "User profile fetched.", UserReadSerializer(request.user).data, 200)

    def patch(self, request):
        """Partially update the authenticated user's own profile."""
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_response(False, "Validation failed.", serializer.errors, 400)
        serializer.save()
        # Return the full updated profile so the client can refresh its state.
        return api_response(True, "Profile updated.", UserReadSerializer(request.user).data, 200)
