"""
Supabase Storage upload service.

Handles all interaction with the Supabase Storage API. The rest of the
application never imports supabase directly — it always goes through this
module so the storage backend can be swapped without touching business logic.
"""

import os
import uuid

from django.conf import settings


def _get_client():
    """
    Build and return a Supabase client using credentials from settings.

    Deferred import so the app does not crash on startup if supabase-py is
    not installed yet during initial setup.
    """
    from supabase import create_client  # noqa: PLC0415

    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_KEY

    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")

    return create_client(url, key)


def upload_file_to_supabase(file_obj, submission_type: str) -> str:
    """
    Upload a file to Supabase Storage and return its public URL.

    Args:
        file_obj:        The InMemoryUploadedFile or similar file-like object
                         from the Django request.
        submission_type: One of 'certificate', 'cgpa', 'paper'. Used to
                         organise files into subfolders inside the bucket.

    Returns:
        The full public HTTPS URL of the uploaded file.

    Raises:
        RuntimeError: If the upload fails or the public URL cannot be retrieved.
    """
    client = _get_client()
    bucket: str = settings.SUPABASE_BUCKET

    # Build a unique storage path to prevent filename collisions.
    original_name: str = getattr(file_obj, "name", "file")
    extension: str = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "bin"
    unique_filename: str = f"{uuid.uuid4().hex}.{extension}"
    storage_path: str = f"{submission_type}/{unique_filename}"

    file_bytes: bytes = file_obj.read()

    # supabase-py upload call.
    response = client.storage.from_(bucket).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": file_obj.content_type or "application/octet-stream"},
    )

    # supabase-py raises an exception on failure, but we add an explicit check
    # for cases where the library silently returns an error object.
    if hasattr(response, "error") and response.error:
        raise RuntimeError(f"Supabase upload failed: {response.error}")

    # Build the public URL from project URL + bucket + path.
    public_url: str = (
        f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{storage_path}"
    )
    return public_url
