"""Account-domain models including the custom user model."""

import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserRole(models.TextChoices):
    """Role choices used for role-based access control."""

    STUDENT = "student", "Student"
    ADMIN = "admin", "Admin"
    ORGANIZER = "organizer", "Organizer"


class UserManager(BaseUserManager):
    """Custom user manager to support email-based authentication."""

    use_in_migrations = True

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        """Create and persist a regular user with a hashed password."""
        if not email:
            raise ValueError("The email field is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        """Create and persist a superuser with mandatory privileges."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Platform user model mapped to the provided users schema.

    Notes:
    - UUID is used as the primary key.
    - `password` is persisted to the `password_hash` DB column as requested.
    - `username` is removed and email is used for authentication.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    first_name = None
    last_name = None

    roll_no = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=255, blank=True, default="")
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(_("password"), max_length=128, db_column="password_hash")
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STUDENT, db_index=True)
    year = models.IntegerField(null=True, blank=True)
    branch = models.CharField(max_length=255, blank=True, default="")
    total_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["roll_no"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["roll_no"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self) -> str:
        return f"{self.roll_no} - {self.email}"
