"""
FastAPI microservice wrapping the InsightFace attendance system.

Endpoints:
  POST /register          — register a student's face into ChromaDB
  POST /detect            — detect faces in a photo, return roll numbers only
  POST /detect-and-mark   — detect faces then call Django to mark attendance
"""

import os
import tempfile

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from orchestrator import AttendanceOrchestrator


app = FastAPI(title="Face Recognition Attendance Service")

# Allow all origins during development; tighten this in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Django backend base URL — override via DJANGO_BASE_URL env var.
DJANGO_BASE_URL: str = os.getenv("DJANGO_BASE_URL", "http://127.0.0.1:8000")

# Load the face recognition system once at startup.
# ctx_id=-1 uses CPU; set to 0 for GPU.
_orchestrator: AttendanceOrchestrator | None = None


def get_orchestrator() -> AttendanceOrchestrator:
    """
    Return the singleton orchestrator instance, initialising it on first call.
    Deferred so the model loads after FastAPI startup, not at import time.
    """
    global _orchestrator
    if _orchestrator is None:
        ctx_id = int(os.getenv("CTX_ID", "-1"))
        _orchestrator = AttendanceOrchestrator(ctx_id=ctx_id)
    return _orchestrator


def _save_upload_to_tempfile(upload: UploadFile) -> str:
    """
    Write an uploaded file to a temporary path on disk and return the path.

    The caller is responsible for deleting the file after use.
    InsightFace requires a file path, not a file-like object.
    """
    suffix = os.path.splitext(upload.filename or ".jpg")[-1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(upload.file.read())
        return tmp.name


# --------------------------------------------------------------------------- #
#  Routes                                                                      #
# --------------------------------------------------------------------------- #

@app.get("/health")
def health():
    """Simple liveness check."""
    return {"status": "ok"}


@app.post("/register")
async def register_student(
    roll_no: str = Form(..., description="Student roll number, must match users table"),
    name: str = Form(..., description="Student full name"),
    file: UploadFile = File(..., description="Clear face photo of the student"),
):
    """
    Register a student's face embedding into ChromaDB.

    Must be called once per student before attendance can be marked.
    The roll_no must already exist in the Django users table.
    """
    tmp_path = _save_upload_to_tempfile(file)
    try:
        success = get_orchestrator().register(tmp_path, roll_no, name)
    finally:
        os.unlink(tmp_path)

    if not success:
        raise HTTPException(status_code=400, detail=f"No face detected in the uploaded image for {roll_no}.")

    return {
        "success": True,
        "message": f"Student {name} ({roll_no}) registered successfully.",
    }


@app.post("/detect")
async def detect_faces(
    file: UploadFile = File(..., description="Group photo or single photo"),
    threshold: float = Form(0.45, description="Similarity threshold (0-1), higher = stricter"),
):
    """
    Detect and identify faces in a photo. Returns roll numbers only.

    Use this endpoint for testing or when you want to manually send roll numbers
    to Django yourself.
    """
    tmp_path = _save_upload_to_tempfile(file)
    try:
        results = get_orchestrator().mark(tmp_path, threshold=threshold)
    finally:
        os.unlink(tmp_path)

    roll_numbers = [r["roll"] for r in results]

    return {
        "success": True,
        "recognized_count": len(roll_numbers),
        "roll_numbers": roll_numbers,
        "details": results,
    }


@app.post("/detect-and-mark")
async def detect_and_mark(
    file: UploadFile = File(..., description="Group photo or single photo"),
    event_id: str = Form(..., description="UUID of the event in Django"),
    django_token: str = Form(..., description="JWT access token of an organizer/admin account"),
    threshold: float = Form(0.45, description="Similarity threshold (0-1)"),
):
    """
    Full pipeline: detect faces → identify roll numbers → call Django to mark attendance.

    Steps:
      1. Save uploaded image to a temp file.
      2. Run InsightFace detection + ChromaDB lookup to get roll numbers.
      3. POST the roll numbers to Django's /attendance/mark/ endpoint.
      4. Return the combined result to the caller.

    The caller only needs to supply the group photo, event_id, and a valid Django
    organizer/admin JWT token. All other steps are handled internally.
    """
    # Step 1 + 2: Run face recognition.
    tmp_path = _save_upload_to_tempfile(file)
    try:
        results = get_orchestrator().mark(tmp_path, threshold=threshold)
    finally:
        os.unlink(tmp_path)

    roll_numbers: list[str] = [r["roll"] for r in results]

    if not roll_numbers:
        return {
            "success": True,
            "message": "No students recognised in the photo.",
            "recognized_count": 0,
            "roll_numbers": [],
            "attendance_result": None,
        }

    # Step 3: Forward roll numbers to Django.
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DJANGO_BASE_URL}/attendance/mark/",
                json={
                    "event_id": event_id,
                    "roll_numbers": roll_numbers,
                },
                headers={"Authorization": f"Bearer {django_token}"},
                timeout=30.0,
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Could not reach Django backend at {DJANGO_BASE_URL}: {exc}",
            )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Django attendance endpoint returned {response.status_code}: {response.text}",
        )

    django_data = response.json()

    # Step 4: Return combined result.
    return {
        "success": True,
        "message": "Attendance marked successfully.",
        "recognized_count": len(roll_numbers),
        "roll_numbers": roll_numbers,
        "recognition_details": results,
        "attendance_result": django_data.get("data", {}),
    }
