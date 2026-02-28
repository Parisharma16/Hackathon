"""
Django settings for student engagement backend.

The configuration is intentionally explicit and environment-driven so it can be
used safely in development and production without code changes.
"""

from pathlib import Path
import os
from datetime import timedelta

# Load environment variables from a .env file when present.
# This is a no-op if python-dotenv is not installed or the file is missing.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# Base directory of the repository.
BASE_DIR = Path(__file__).resolve().parent.parent


# Core security configuration.
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-dev-secret-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"

# ALLOWED_HOSTS is parsed from comma-separated values to support deployment
# environments where one env var must carry all hosts.
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")
    if host.strip()
]


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # django.contrib.postgres is required for ArrayField (events.winners_roll_nos).
    "django.contrib.postgres",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "accounts",
    "events",
    "attendance",
    "submissions",
    "reviews",
    "points",
    "shop",
]

MIDDLEWARE = [
    # CorsMiddleware must appear before any middleware that can generate responses
    # (i.e. before CommonMiddleware) so that CORS headers are added to every response.
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# PostgreSQL database configuration with strict environment variable usage.
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": os.getenv("DB_NAME", ""),
#         "USER": os.getenv("DB_USER", ""),
#         "PASSWORD": os.getenv("DB_PASSWORD", ""),
#         "HOST": os.getenv("DB_HOST", "localhost"),
#         "PORT": os.getenv("DB_PORT", "5432"),
#         # Render-hosted PostgreSQL requires SSL for external connections.
#         "OPTIONS": {
#             "sslmode": "require",
#         },
#     }
# }

import dj_database_url
import os

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True
    )
}


AUTH_USER_MODEL = "accounts.User"


# Password validation remains enabled to enforce baseline account hygiene.
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Local media storage for user submissions.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Supabase Storage configuration for file uploads.
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "submissions")


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# CORS - allow the Next.js frontend to call the API across origins.
# Set CORS_ALLOWED_ORIGINS as a comma-separated list in .env for production.
# Example: CORS_ALLOWED_ORIGINS=https://myapp.vercel.app,http://localhost:3000
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

# The frontend sends JWT tokens via the Authorization header, not cookies,
# so cross-origin credentials are not required.
CORS_ALLOW_CREDENTIALS = False
