# routes/resumes.py
from typing import List, Optional
import os
import hashlib
import datetime as dt

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from pymongo.database import Database
from src.db_connection import get_db

router = APIRouter(prefix="/v1/jobs", tags=["resumes"])

# ---------- Config ----------
JOBS_COLLECTION = os.getenv("JOBS_COLLECTION", "jobs")

# IMPORTANT: your Windows path as default RESUME_ROOT (can be overridden via .env)
RESUME_ROOT = os.path.abspath(
    os.getenv(
        "RESUME_STORAGE_ROOT",
        r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"
    )
)
os.makedirs(RESUME_ROOT, exist_ok=True)

MAX_FILE_MB = float(os.getenv("MAX_FILE_MB", "8"))
MAX_FILE_BYTES = int(MAX_FILE_MB * 1024 * 1024)

ALLOWED_EXTS = {s.strip().lower() for s in os.getenv("ALLOWED_EXTS", ".pdf,.doc,.docx").split(",") if s.strip()}
ALLOWED_MIMES = {
    s.strip().lower()
    for s in os.getenv(
        "ALLOWED_MIMES",
        "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ).split(",")
    if s.strip()
}

# ---------- If you already have a get_db() in your project, import and use it ----------
# def get_db() -> Database:
#     from pymongo import MongoClient
#     client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"), tz_aware=True)
#     return client[os.getenv("MONGODB_DB", "virtual_ta")]

# ---------- Helpers ----------
def safe_segment(s: str) -> str:
    # Avoid path traversal; keep folder name safe
    return str(s).replace("\\", "_").replace("/", "_").replace("..", "_").strip()

def sanitize_filename(name: str) -> str:
    base, _ = os.path.splitext(name or "resume")
    base = "".join(ch for ch in base if ch.isalnum() or ch in "-_ ").strip()
    base = "_".join(base.split())
    return base[:64] or "resume"

def pick_ext(filename: str, content_type: Optional[str]) -> str:
    ext = os.path.splitext(filename or "")[1].lower()
    if ext in ALLOWED_EXTS:
        return ext
    if (content_type or "").lower() in ALLOWED_MIMES:
        if content_type == "application/pdf":
            return ".pdf"
        if content_type == "application/msword":
            return ".doc"
        if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return ".docx"
    return ext if ext in ALLOWED_EXTS else ".bin"

def validate_type(filename: str, content_type: Optional[str]):
    ext_ok = os.path.splitext(filename or "")[1].lower() in ALLOWED_EXTS
    mime_ok = (content_type or "").lower() in ALLOWED_MIMES
    if not (ext_ok or mime_ok):
        raise HTTPException(status_code=400, detail="Unsupported file type (only PDF/DOC/DOCX)")

def ensure_req_folder(requirement_id: str) -> str:
    dest = os.path.join(RESUME_ROOT, safe_segment(requirement_id))
    os.makedirs(dest, exist_ok=True)
    return dest

# ---------- Endpoint: SAVE ONLY, NO DB WRITES ----------
@router.post("/{job_id}/resumes")
async def upload_resumes(
    job_id: str,
    resume: List[UploadFile] = File(..., description="One or more files under 'resume' field"),
    # Optional: if you pass this from client, backend will not hit DB
    requirementId: Optional[str] = Form(default=None),
    # If you don't want any DB lookups at all, remove `db` and related code below
    db: Database = Depends(get_db),
):
    """
    Saves uploaded resumes into:
      <RESUME_ROOT>/<requirement_id>/
    No database writes. Only filesystem I/O.
    """
    if not resume:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Resolve requirement_id:
    # 1) Prefer explicit form value if provided and valid.
    # 2) Else, look up from jobs collection using job_id.
    req_id = (requirementId or "").strip()
    if not req_id:
        job = db[JOBS_COLLECTION].find_one(
            {"id": job_id},
            projection={"_id": 0, "requirement_id": 1}
        )
        if not job or not job.get("requirement_id"):
            raise HTTPException(status_code=400, detail="Cannot resolve requirement_id for this job")
        req_id = job["requirement_id"]

    # Guard against placeholder values like "string"
    if req_id.lower() in {"string", "req_id", "requirement_id"}:
        raise HTTPException(status_code=400, detail="Invalid requirement_id value")

    target_dir = ensure_req_folder(req_id)

    results = []
    for uf in resume:
        validate_type(uf.filename, uf.content_type)

        base = sanitize_filename(uf.filename or "resume")
        ext = pick_ext(uf.filename, uf.content_type)
        # stamp = dt.datetime.utcnow().isoformat().replace(":", "-").replace(".", "-")
        final_name = f"{base}{ext}"
        final_path = os.path.join(target_dir, final_name)

        # Stream to disk with size limit; compute SHA-256 (useful for UI, but not stored)
        sha256 = hashlib.sha256()
        size = 0
        CHUNK = 1024 * 1024  # 1 MB

        try:
            with open(final_path, "wb") as out:
                while True:
                    chunk = await uf.read(CHUNK)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_FILE_BYTES:
                        out.close()
                        try:
                            os.remove(final_path)
                        except OSError:
                            pass
                        raise HTTPException(status_code=400, detail=f"File too large (>{MAX_FILE_MB} MB)")
                    sha256.update(chunk)
                    out.write(chunk)
        finally:
            await uf.close()

        file_hash = sha256.hexdigest()

        results.append({
            "originalName": uf.filename,
            "savedAs": final_name,
            "size": size,
            "mimetype": uf.content_type,
            "sha256": file_hash,
            "requirement_id": req_id,
            "path": os.path.relpath(final_path, RESUME_ROOT).replace("\\", "/"),
            # For troubleshooting where it landed; remove in prod if you want
            "absPath": os.path.abspath(final_path),
        })

    return JSONResponse(
        status_code=201,
        content={"ok": True, "jobId": job_id, "requirement_id": req_id, "stored": results, "root": RESUME_ROOT},
    )