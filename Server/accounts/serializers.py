"""Serializers for account registration, login, and profile output."""

from django.contrib.auth import authenticate
from rest_framework import serializers

from accounts.models import User, UserRole


class UserReadSerializer(serializers.ModelSerializer):
    """Read serializer for user profile responses."""

    class Meta:
        model = User
        fields = [
            "id",
            "roll_no",
            "name",
            "email",
            "role",
            "year",
            "branch",
            "total_points",
            "profile_pic",
            "created_at",
            "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """Write serializer for user registration."""

    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.STUDENT)
    # Client uploads profile pic to Supabase first, then passes the URL here.
    profile_pic = serializers.CharField(required=False, allow_null=True, default=None)

    class Meta:
        model = User
        fields = [
            "roll_no",
            "name",
            "email",
            "password",
            "role",
            "year",
            "branch",
            "profile_pic",
        ]

    def create(self, validated_data):
        """Create a user using the manager to ensure password hashing."""
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    """Write serializer for credential-based login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Validate credentials against Django auth backend."""
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(request=self.context.get("request"), email=email, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs
