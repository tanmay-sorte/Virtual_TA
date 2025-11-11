# src/routes/jobs.py
from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from pymongo import ASCENDING, DESCENDING, IndexModel, ReturnDocument
from datetime import datetime, date, time
from typing import Any, Dict, List
from src.models.user import JobCreate, JobUpdate
from bson import ObjectId
import os
from src.llm.jd import process_jd_text
import json
from src.llm.resume_scoring import run_scoring_flow

from src.db_connection import get_db

router = APIRouter(prefix="/v1/jobs", tags=["jobs"])

# def ensure_job_indexes() -> None:
#     """
#     Create useful indexes for the jobs collection.
#     Safe to call multiple times; create_indexes is idempotent.
#     """
#     db = get_db()
#     db["jobs"].create_indexes([
#         IndexModel([("opening_date", ASCENDING)]),
#         IndexModel([("status", ASCENDING)]),
#         # If you add search by title later:
#         # IndexModel([("title", "text")]),
#     ])



def to_ymd(value) -> str:
    if not value:
        return "-"
    try:
        if isinstance(value, datetime):
            dt = value
        else:
            # Try common formats; adjust if you store strings
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return str(value)
    

# Optional: configure via env var; falls back to your current absolute path
APPLICANTS_BASE_DIR = os.getenv(
    "APPLICANTS_BASE_DIR",
    r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"
)

def count_applicants(requirement_id) -> int:
    """
    Count applicant files for a given requirement_id folder.
    Returns 0 if requirement_id is missing, the base or folder doesn't exist,
    or any unexpected error occurs.
    """
    try:
        # Guard against None/missing IDs
        if requirement_id is None:
            # Optionally log for debugging
            # print("[count_applicants] requirement_id is None -> 0")
            return 0

        # Ensure we pass a string to os.path.join
        req_id_str = str(requirement_id)

        # Guard against missing base dir config
        if not APPLICANTS_BASE_DIR:
            # print("[count_applicants] APPLICANTS_BASE_DIR is not set -> 0")
            return 0

        folder_path = os.path.join(APPLICANTS_BASE_DIR, req_id_str)

        if not (os.path.exists(folder_path) and os.path.isdir(folder_path)):
            return 0

        # Count files only (skip subdirectories)
        total = sum(
            1
            for name in os.listdir(folder_path)
            if os.path.isfile(os.path.join(folder_path, name))
        )

        if total >= 2:
            return total - 2
        return total
    except Exception as e:
        # Fail-safe: never take the whole request down for counting
        # print(f"[count_applicants] Error: {e!r} -> 0")
        return 0

from datetime import datetime
from typing import Any, Dict, Optional

DATE_FMT = "%Y-%m-%d"

def _parse_date_safe(value: Any) -> Optional[datetime]:
    """
    Accepts datetime, date-like string (YYYY-MM-DD...), or None.
    Returns a datetime or None without raising.
    """
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    s = str(value).strip()
    if not s:
        return None
    try:
        # Accept first 10 chars to handle 'YYYY-MM-DD...' formats
        return datetime.strptime(s[:10], DATE_FMT)
    except Exception:
        return None
def _to_ymd_str(dt: Optional[datetime]) -> str:
    """
    Formats datetime to 'YYYY-MM-DD' or '-' if None.
    """
    return dt.strftime(DATE_FMT) if isinstance(dt, datetime) else "-"

def _normalize_status(value: Any) -> str:
    """
    Normalizes various status spellings to one of:
    'open', 'on-hold', 'closed'. Unknowns are returned as-is.
    """
    raw = str(value or "open").strip().lower()
    if raw in {"open"}:
        return "open"
    if raw in {"on-hold", "on_hold", "hold"}:
        return "on-hold"
    if raw in {"closed", "close"}:
        return "closed"
    return raw  # unknowns will be ranked last by your sort map

def normalize_job(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes a job document for API output and sorting stability.
    - Ensures 'status' is normalized.
    - Ensures dates are safely parsed and displayed as 'YYYY-MM-DD'.
    - Adds internal datetime keys for reliable server-side sorting.
    """
    opening_dt = _parse_date_safe(doc.get("opening_date"))
    closing_dt = _parse_date_safe(doc.get("closing_date"))
    status = _normalize_status(doc.get("status"))

    return {
        "id": str(doc.get("_id")),
        "requirement_id": doc.get("requirement_id") or "-",
        "title": doc.get("title") or "-",
        "opening_date": _to_ymd_str(opening_dt),  # display value
        "closing_date": _to_ymd_str(closing_dt),  # display value
        "applicants_count": int(doc.get("applicants_count") or 0),
        "slots": int(doc.get("slots") or 0),
        "status": status,
        # Internal sort keys (remove before sending to client if desired)
        "_opening_dt": opening_dt,
        "_closing_dt": closing_dt,
    }


@router.get("")
def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db = Depends(get_db),
):
    collection = db["jobs"]

    projection = {
        "requirement_id": 1,
        "title": 1,
        "opening_date": 1,
        "closing_date": 1,
        "applicants_count": 1,
        "slots": 1,
        "status": 1,
    }

    all_jobs = list(collection.find({}, projection=projection))

    jobs = []
    for doc in all_jobs:
        doc["applicants_count"] = count_applicants(doc["requirement_id"])
        jobs.append(normalize_job(doc))

    # ✅ Define explicit order: open → on-hold → closed
    status_order = {"open": 0, "on-hold": 1, "closed": 2}

    jobs.sort(key=lambda job: (
        status_order.get(job["status"], 99),  # unknown statuses go last
        job["opening_date"]
    ))

    # ✅ Paginate after sorting
    total = len(jobs)
    start = (page - 1) * limit
    end = start + limit
    paginated_jobs = jobs[start:end]

    return {"items": paginated_jobs, "total": total}



# @router.post("/create", status_code=status.HTTP_201_CREATED)
# def create_job(job: JobCreate):
#     jobs_collection = get_db()["jobs"]

#     # Convert to dict
#     job_dict = job.model_dump()

#     # Convert date fields
#     job_dict["opening_date"] = datetime.combine(job.opening_date, datetime.min.time())
#     job_dict["closing_date"] = (
#         datetime.combine(job.closing_date, datetime.min.time()) if job.closing_date else None
#     )

#     # Auto-generate requirement_id
#     year = datetime.now().year
#     count = jobs_collection.count_documents({"requirement_id": {"$regex": f"^REQ-{year}-"}})
#     requirement_id = f"REQ-{year}-{(101 + count):04d}"  # starts at REQ-2025-0101
#     job_dict["requirement_id"] = requirement_id

#     # Insert job
#     result = jobs_collection.insert_one(job_dict)

#     # Create folder
#     folder_path = os.path.join(
#         r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes",
#         requirement_id
#     )
#     os.makedirs(folder_path, exist_ok=True)

#     # Process JD
#     jd_data, jd_embedding = process_jd_text(job.jd)

#     # Save JD artifacts
#     with open(os.path.join(folder_path, "jd_data.json"), "w", encoding="utf-8") as f:
#         json.dump(jd_data, f, indent=4, ensure_ascii=False)

#     serializable_embeddings = {k: list(map(float, v)) for k, v in jd_embedding.items()}
#     with open(os.path.join(folder_path, "jd_embedding.json"), "w", encoding="utf-8") as f:
#         json.dump(serializable_embeddings, f, indent=4)

#     return {
#         "message": "Job created successfully.",
#         "job_id": str(result.inserted_id),
#         "requirement_id": requirement_id
#     }

@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate):
    jobs_collection = get_db()["jobs"]

    # Convert to dict
    job_dict = job.model_dump()

    # Convert date fields
    job_dict["opening_date"] = datetime.combine(job.opening_date, datetime.min.time())
    job_dict["closing_date"] = (
        datetime.combine(job.closing_date, datetime.min.time()) if job.closing_date else None
    )

    # Auto-generate requirement_id
    year = datetime.now().year
    count = jobs_collection.count_documents({"requirement_id": {"$regex": f"^REQ-{year}-"}})
    requirement_id = f"REQ-{year}-{(101 + count):04d}"  # starts at REQ-2025-0101
    job_dict["requirement_id"] = requirement_id

    # Insert job
    result = jobs_collection.insert_one(job_dict)

    # Create folder
    folder_path = os.path.join(
        r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes",
        requirement_id, "JD_Data"
    )
    os.makedirs(folder_path, exist_ok=True)

    # Process JD
    jd_data, jd_embedding = process_jd_text(job.jd)

    # Save JD artifacts
    with open(os.path.join(folder_path, "jd_data.json"), "w", encoding="utf-8") as f:
        json.dump(jd_data, f, indent=4, ensure_ascii=False)

    serializable_embeddings = {k: list(map(float, v)) for k, v in jd_embedding.items()}
    with open(os.path.join(folder_path, "jd_embedding.json"), "w", encoding="utf-8") as f:
        json.dump(serializable_embeddings, f, indent=4)

    return {
        "message": "Job created successfully.",
        "job_id": str(result.inserted_id),
        "requirement_id": requirement_id
    }



def _to_start_of_day_if_date(value):
    """Accepts date or datetime; returns datetime; None stays None."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, time.min)
    # If it’s a string, rely on Pydantic to parse, so we shouldn't get here.
    return value



@router.put("/{job_id}/update", status_code=status.HTTP_200_OK)
def update_job(job_id: str, job: "JobUpdate"):
    jobs_collection = get_db()["jobs"]

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID.")

    # Load the current document to compare and ensure existence
    existing = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found.")

    try:
        # Pydantic v2
        job_dict = job.model_dump(exclude_unset=True, exclude_none=True)

        # ---- Prevent changing requirement_id (server-side enforcement) ----
        if "requirement_id" in job_dict:
            incoming_req = job_dict["requirement_id"]
            current_req = existing.get("requirement_id")
            if incoming_req != current_req:
                raise HTTPException(
                    status_code=400,
                    detail="Requirement ID cannot be changed."
                )
            # No change -> remove to avoid a no-op write
            job_dict.pop("requirement_id", None)

        # Convert dates if present
        if "opening_date" in job_dict:
            job_dict["opening_date"] = _to_start_of_day_if_date(job_dict["opening_date"])
        if "closing_date" in job_dict:
            job_dict["closing_date"] = _to_start_of_day_if_date(job_dict["closing_date"])

        # Never allow id changes
        job_dict.pop("_id", None)
        job_dict.pop("id", None)

        if not job_dict:
            raise HTTPException(status_code=400, detail="No fields provided to update.")

        updated_doc = jobs_collection.find_one_and_update(
            {"_id": ObjectId(job_id)},
            {"$set": job_dict},
            return_document=ReturnDocument.AFTER
        )

        if not updated_doc:
            raise HTTPException(status_code=404, detail="Job not found.")

    except HTTPException:
        # Let intended HTTP errors pass through
        raise
    except Exception as e:
        print(f"Error during job update (DB/validation): {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

    # ---- Optional: JD processing & file I/O (non-fatal) ----
    try:
        jd_text = job_dict.get("jd")  # Only if client actually sent jd in this request
        # Use requirement_id from existing (cannot change)
        requirement_id = existing.get("requirement_id")

        if jd_text and requirement_id:
            # Base folder from env or fallback
            base_folder = os.getenv(
                "RESUME_BASE",
                r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"
            )
            folder_path = os.path.join(base_folder, requirement_id)
            os.makedirs(folder_path, exist_ok=True)

            jd_data, jd_embedding = process_jd_text(jd_text)

            with open(os.path.join(folder_path, "jd_data.json"), "w", encoding="utf-8") as f:
                json.dump(jd_data, f, indent=4, ensure_ascii=False)

            serializable_embeddings = {key: [float(x) for x in value] for key, value in jd_embedding.items()}
            with open(os.path.join(folder_path, "jd_embedding.json"), "w", encoding="utf-8") as f:
                json.dump(serializable_embeddings, f, indent=4)

    except Exception as e:
        # Log but don't fail the whole request
        print(f"Non-fatal JD processing error: {e}")

    return {"message": "Job updated successfully."}




@router.get("/{job_id}")
def get_job(job_id: str):
    print("get job_id details successful")
    jobs_collection = get_db()["jobs"]

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID.")

    job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Convert MongoDB datetime to date string
    job["opening_date"] = job["opening_date"].strftime("%Y-%m-%d")
    job["closing_date"] = job["closing_date"].strftime("%Y-%m-%d")
    job["_id"] = str(job["_id"])  # Ensure _id is serializable

    return job

BASE_RESUME_PATH = r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"
IGNORED_BASENAMES = {"jd_data", "jd_embedding"}
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}  # Optional: restrict to resume formats
SCORE_COLLECTION_NAME = "job_scores"
SCORABLE_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}

def get_scores_collection():
    return get_db()[SCORE_COLLECTION_NAME]



def _list_folder_applicants(requirement_id: str, request: Request):
    """
    Build applicant list from files in BASE_RESUME_PATH/<requirement_id>.
    Show all allowed resume files; skip JD/embedding/json.
    """
    folder_path = os.path.join(BASE_RESUME_PATH, requirement_id)
    applicants = []

    if not os.path.exists(folder_path):
        return folder_path, applicants

    base_url = str(request.base_url).rstrip("/")

    for filename in os.listdir(folder_path):
        fullpath = os.path.join(folder_path, filename)

        if not os.path.isfile(fullpath):
            continue
        if filename.startswith("."):
            continue

        
        base, ext = os.path.splitext(filename)
        if base.lower() in IGNORED_BASENAMES:
            continue
        if ext.lower() not in ALLOWED_EXTENSIONS:
            continue
        if ext.lower() == ".json":
            continue  # explicit safety

        resume_url = f"{base_url}/static/resumes/{requirement_id}/{filename}"

        applicants.append({
            "name": base,
            "filename": filename,        # keep filename so FE can be smarter later
            "resume_url": resume_url,
            "score": None,               # filled by merge
            "scores": None               # filled by merge
        })

    return folder_path, applicants


def _merge_scores_into_applicants(applicants: list, score_doc: dict | None):
    """
    Merge Mongo scores into the applicant list.
    Supports BOTH shapes:
      A) flat:   scores = { "High_Match.txt": {...} }
      B) nested: scores = { "High_Match": { "txt": {...} } }
    """
    if not score_doc:
        return applicants

    scores_obj = score_doc.get("scores") or {}
    if not isinstance(scores_obj, dict):
        return applicants

    # Build a flat lookup map: "High_Match.txt" -> score entry
    flat_scores = {}

    for k, v in scores_obj.items():
        # k could be "High_Match" and v could be {"txt": {...}}
        if isinstance(v, dict) and all(isinstance(x, dict) for x in v.values()):
            # nested case: join with dot for each inner key
            for ext_no_dot, entry in v.items():
                if not isinstance(entry, dict):
                    continue
                fname = f"{k}.{ext_no_dot}"
                flat_scores[fname] = entry
        elif isinstance(v, dict):
            # already flat-ish: assume k is the full filename
            flat_scores[k] = v
        # else: ignore non-dict entries

    # Now merge into applicants by exact filename
    for a in applicants:
        fn = a.get("filename")
        if not fn:
            continue
        entry = flat_scores.get(fn)
        if entry:
            a["scores"] = {
                "skills_score": entry.get("skills_score"),
                "education_score": entry.get("education_score"),
                "experience_score": entry.get("experience_score"),
                "overall_score": entry.get("overall_score"),
                "reason": entry.get("reason"),
                "scored_at": entry.get("scored_at"),
            }
            a["score"] = entry.get("overall_score")

    return applicants


def _now_iso():
    return datetime.now().replace(microsecond=0).isoformat() + "Z"


def _is_valid_object_id(oid: str) -> bool:
    try:
        return ObjectId.is_valid(oid)
    except Exception:
        return False


def _get_job_or_404(job_id: str):
    jobs_collection = get_db()["jobs"]
    if not _is_valid_object_id(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    job = jobs_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def invoke_scoring_flow(requirement_id: str):
    """
    Call the stable wrapper from the pipeline.
    Returns: list[{"file": str, "scores": {...}}]
    """
    if run_scoring_flow is None:
        raise HTTPException(status_code=500, detail="Scoring pipeline is not available to the API")
    try:
        return run_scoring_flow(requirement_id)
    except Exception as e:
        # Optional: log full stack for server logs
        # logger.exception("run_scoring_flow failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Scoring failed in pipeline: {e}")


def _norm_filename(name: str) -> str:
    """Case-insensitive, whitespace-trimmed normalization for filenames."""
    return (name or "").strip().lower()

def _now_iso():
    import datetime as dt
    return dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def _merge_scores_into_applicants(applicants: list, score_doc: dict | None):
    """
    Merge Mongo scores into the applicant list.
    Supports BOTH shapes:
      A) flat:   scores = { "High_Match.txt": {...} }
      B) nested: scores = { "High_Match": { "txt": {...} } }
    """
    if not score_doc:
        return applicants

    scores_obj = score_doc.get("scores") or {}
    if not isinstance(scores_obj, dict):
        return applicants

    # Build a flat lookup map: "High_Match.txt" -> score entry
    flat_scores = {}

    for k, v in scores_obj.items():
        # k could be "High_Match" and v could be {"txt": {...}}
        if isinstance(v, dict) and all(isinstance(x, dict) for x in v.values()):
            # nested case: join with dot for each inner key
            for ext_no_dot, entry in v.items():
                if not isinstance(entry, dict):
                    continue
                fname = f"{k}.{ext_no_dot}"
                flat_scores[fname] = entry
        elif isinstance(v, dict):
            # already flat-ish: assume k is the full filename
            flat_scores[k] = v

    # Now merge into applicants by exact filename
    for a in applicants:
        fn = a.get("filename")
        if not fn:
            continue
        entry = flat_scores.get(fn)
        if entry:
            a["scores"] = {
                "skills_score": entry.get("skills_score"),
                "education_score": entry.get("education_score"),
                "experience_score": entry.get("experience_score"),
                "overall_score": entry.get("overall_score"),
                "reason": entry.get("reason"),
                "scored_at": entry.get("scored_at"),
            }
            a["score"] = entry.get("overall_score")
    return applicants


# @router.get("/{job_id}/applications")
# async def get_job_applications(job_id: str, request: Request):
#     job = _get_job_or_404(job_id)
#     requirement_id = job.get("requirement_id")
#     if not requirement_id:
#         raise HTTPException(status_code=400, detail="Job missing requirement_id")

#     folder_path, applicants = _list_folder_applicants(requirement_id, request)

#     # Load existing scores for this job/requirement
#     scores_col = get_scores_collection()
#     score_doc = scores_col.find_one({"job_id": ObjectId(job_id), "requirement_id": requirement_id})

#     applicants = _merge_scores_into_applicants(applicants, score_doc)

#     return {
#         "job": {
#             "id": str(job["_id"]),
#             "requirement_id": requirement_id,
#             "title": job.get("title"),
#             "location": job.get("location"),
#             "workmode": job.get("workmode"),
#             "description": job.get("description"),
#             "opening_date": str(job.get("opening_date"))[:10],
#             "closing_date": str(job.get("closing_date"))[:10],
#             "status": job.get("status"),
#             "slots": job.get("slots"),
#             "jd": job.get("jd"),
#         },
#         "applicants": applicants,
#     }

from fastapi import HTTPException, Request, Query
from math import ceil

@router.get("/{job_id}/applications")
async def get_job_applications(
    job_id: str,
    request: Request,
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page")
):
    job = _get_job_or_404(job_id)
    requirement_id = job.get("requirement_id")
    if not requirement_id:
        raise HTTPException(status_code=400, detail="Job missing requirement_id")

    folder_path, applicants = _list_folder_applicants(requirement_id, request)

    # Load existing scores for this job/requirement
    scores_col = get_scores_collection()
    score_doc = scores_col.find_one({"job_id": ObjectId(job_id), "requirement_id": requirement_id})

    applicants = _merge_scores_into_applicants(applicants, score_doc)

    # ---- Pagination ----
    total = len(applicants)
    total_pages = max(1, ceil(total / page_size)) if total > 0 else 1
    # Clamp page to available range
    if page > total_pages:
        page = total_pages

    start = (page - 1) * page_size
    end = start + page_size
    paged_applicants = applicants[start:end]

    # Optional: navigation links (keeps other query params intact)
    def page_url(target_page: int) -> str | None:
        if target_page < 1 or (total > 0 and target_page > total_pages):
            return None
        return str(request.url.include_query_params(page=target_page, page_size=page_size))

    return {
        "job": {
            "id": str(job["_id"]),
            "requirement_id": requirement_id,
            "title": job.get("title"),
            "location": job.get("location"),
            "workmode": job.get("workmode"),
            "description": job.get("description"),
            "opening_date": str(job.get("opening_date"))[:10],
            "closing_date": str(job.get("closing_date"))[:10],
            "status": job.get("status"),
            "slots": job.get("slots"),
            "jd": job.get("jd"),
        },
        "pagination": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
            "next": page_url(page + 1),
            "prev": page_url(page - 1),
            "self": page_url(page),
        },
        "applicants": paged_applicants,
    }



# @router.post("/{job_id}/score")
# async def score_job_applicants(job_id: str, request: Request):
#     """
#     Synchronously run the scoring pipeline for .txt resumes only in the requirement folder.
#     Only store new scores for resumes not scored yet. Others remain as-is.
#     Non-.txt files are left as NA by design (until pipeline supports them).
#     """
#     job = _get_job_or_404(job_id)
#     requirement_id = job.get("requirement_id")
#     if not requirement_id:
#         raise HTTPException(status_code=400, detail="Job missing requirement_id")

#     folder_path, applicants = _list_folder_applicants(requirement_id, request)
#     if not os.path.exists(folder_path):
#         raise HTTPException(status_code=400, detail=f"Resume folder not found for requirement_id '{requirement_id}'")

#     # It’s common for pipeline.load_jd to require this:
#     jd_path = os.path.join(folder_path, "jd_data.json")
#     if not os.path.isfile(jd_path):
#         raise HTTPException(status_code=400, detail=f"JD file missing: {jd_path}")

#     # Load current score doc
#     scores_col = get_scores_collection()
#     score_doc = scores_col.find_one({"job_id": ObjectId(job_id), "requirement_id": requirement_id}) or {
#         "job_id": ObjectId(job_id),
#         "requirement_id": requirement_id,
#         "scores": {},
#         "created_at": _now_iso(),
#         "updated_at": _now_iso()
#     }
#     existing_scores = score_doc.get("scores", {}) or {}

#     # Build normalized sets from folder (only scorable .txt) and from existing DB
#     folder_txt_norms = set()
#     norm_to_actual = {}  # normalized -> actual filename as on disk
#     for a in applicants:
#         fn = a.get("filename")
#         if not fn:
#             continue
#         ext = os.path.splitext(fn)[1].lower()
#         if ext in SCORABLE_EXTENSIONS:
#             n = _norm_filename(fn)
#             folder_txt_norms.add(n)
#             norm_to_actual[n] = fn

#     # Build set of already-scored normalized names (support nested or flat)
#     already_scored_norms = set()
#     for key, val in existing_scores.items():
#         # If nested (base -> ext -> entry)
#         if isinstance(val, dict) and all(isinstance(x, dict) for x in val.values()):
#             for ext_no_dot in val.keys():
#                 candidate = f"{key}.{ext_no_dot}"
#                 already_scored_norms.add(_norm_filename(candidate))
#         else:
#             # flat key (full filename)
#             already_scored_norms.add(_norm_filename(key))

#     # Determine which are scorable & unscored (by normalized comparison)
#     scorable_unscored_norms = sorted(list(folder_txt_norms - already_scored_norms))

#     if not scorable_unscored_norms:
#         merged = _merge_scores_into_applicants(applicants, score_doc)
#         # <-- PRINTS: nothing new to score
#         print(f"[score_job_applicants] Requirement '{requirement_id}': "
#               f"newly_scored=0, already_scored={len(already_scored_norms)}")
#         return {
#             "job": {
#                 "id": str(job["_id"]),
#                 "requirement_id": requirement_id,
#                 "title": job.get("title"),
#                 "location": job.get("location"),
#                 "workmode": job.get("workmode"),
#                 "description": job.get("description"),
#                 "opening_date": job.get("opening_date"),
#                 "closing_date": job.get("closing_date"),
#                 "status": job.get("status"),
#                 "slots": job.get("slots"),
#                 "jd": job.get("jd"),
#             },
#             "applicants": merged,
#             "debug": {"stored_new": 0, "already_scored": len(already_scored_norms)},
#         }

#     # Invoke scoring pipeline (this may score all .txt in the folder)
#     try:
#         results = invoke_scoring_flow(requirement_id)
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

#     # Merge only NEW scores (normalized) into DB, using nested shape: scores.<base>.<ext>
#     now = _now_iso()
#     set_updates = {}
#     stored_new = 0

#     for r in results or []:
#         raw_fn = r.get("file")
#         sc = r.get("scores", {})
#         if not raw_fn:
#             continue

#         fn_norm = _norm_filename(raw_fn)

#         # Only accept if it's present in folder (.txt) and unscored previously
#         if fn_norm not in scorable_unscored_norms:
#             continue

#         # Map to actual filename as in folder
#         actual_fn = norm_to_actual.get(fn_norm, raw_fn)

#         base_name, ext = os.path.splitext(actual_fn)   # e.g., "High_Match", ".txt"
#         ext_key = (ext or "").lstrip(".").lower()      # "txt"

#         # coerce numeric values safely
#         def fnum(x):
#             try:
#                 return float(x)
#             except Exception:
#                 return None

#         entry = {
#             "skills_score": fnum(sc.get("skills_score")),
#             "education_score": fnum(sc.get("education_score")),
#             "experience_score": fnum(sc.get("experience_score")),
#             "overall_score": fnum(sc.get("overall_score")),
#             "reason": sc.get("reason"),
#             "scored_at": now,
#         }

#         set_updates[f"scores.{base_name}.{ext_key}"] = entry
#         stored_new += 1
#     if set_updates:
#         set_updates["updated_at"] = now
#         scores_col.update_one(
#             {"job_id": ObjectId(job_id), "requirement_id": requirement_id},
#             {"$set": set_updates, "$setOnInsert": {"created_at": score_doc.get("created_at", now)}},
#             upsert=True
#         )

#     # Re-read merged view for response
#     score_doc = scores_col.find_one({"job_id": ObjectId(job_id), "requirement_id": requirement_id})
#     merged = _merge_scores_into_applicants(applicants, score_doc)

#     # <-- PRINTS: after scoring attempt
#     print(f"[score_job_applicants] Requirement '{requirement_id}': "
#           f"newly_scored={stored_new}, already_scored={len(already_scored_norms)}, "
#           f"results_returned={len(results or [])}")

#     return {
#         "job": {
#             "id": str(job["_id"]),
#             "requirement_id": requirement_id,
#             "title": job.get("title"),
#             "location": job.get("location"),
#             "workmode": job.get("workmode"),
#             "description": job.get("description"),
#             "opening_date": job.get("opening_date"),
#             "closing_date": job.get("closing_date"),
#             "status": job.get("status"),
#             "slots": job.get("slots"),
#             "jd": job.get("jd"),
#         },
#         "applicants": merged,
#         "debug": {
#             "stored_new": stored_new,
#             "already_scored": len(already_scored_norms),
#             "results_returned": len(results or []),
#         }
#     }

# routes.py (excerpt)
# import os
import re
# from bson import ObjectId
# from fastapi import HTTPException, Request
# from scoring_flow import run_scoring_flow  # ensure import path is correct

# Score txt, pdf, docx
SCORABLE_EXTENSIONS = {".txt", ".pdf", ".docx"}

def _norm_filename(name: str) -> str:
    # Keep this exactly in sync with scoring_flow._norm_filename
    if not name:
        return ""
    base = name.strip().lower()
    base = re.sub(r"[ \t\r\n]+", " ", base)
    base = base.replace(" ", "_").replace("-", "_")
    return base

@router.post("/{job_id}/score")
async def score_job_applicants(job_id: str, request: Request):
    """
    Score ONLY the unscored resumes with extensions in SCORABLE_EXTENSIONS.
    Stores new results as nested: scores.<base>.<ext>.
    """
    job = _get_job_or_404(job_id)
    requirement_id = job.get("requirement_id")
    if not requirement_id:
        raise HTTPException(status_code=400, detail="Job missing requirement_id")

    folder_path, applicants = _list_folder_applicants(requirement_id, request)
    if not os.path.exists(folder_path):
        raise HTTPException(status_code=400, detail=f"Resume folder not found for requirement_id '{requirement_id}'")

    jd_path = os.path.join(folder_path, "jd_data.json")
    if not os.path.isfile(jd_path):
        raise HTTPException(status_code=400, detail=f"JD file missing: {jd_path}")

    scores_col = get_scores_collection()
    score_doc = scores_col.find_one({"job_id": ObjectId(job_id), "requirement_id": requirement_id}) or {
        "job_id": ObjectId(job_id),
        "requirement_id": requirement_id,
        "scores": {},
        "created_at": _now_iso(),
        "updated_at": _now_iso()
    }
    existing_scores = score_doc.get("scores", {}) or {}

    # Discover scorable files in folder + map norm -> actual
    folder_norms = set()
    norm_to_actual = {}
    for a in applicants:
        fn = a.get("filename")
        if not fn:
            continue
        ext = os.path.splitext(fn)[1].lower()
        if ext in SCORABLE_EXTENSIONS:
            n = _norm_filename(fn)
            folder_norms.add(n)
            norm_to_actual[n] = fn

    # Already-scored (support nested and flat)
    already_scored_norms = set()
    for key, val in existing_scores.items():
        if isinstance(val, dict) and all(isinstance(x, dict) for x in val.values()):
            for ext_no_dot in val.keys():
                candidate = f"{key}.{ext_no_dot}"
                already_scored_norms.add(_norm_filename(candidate))
        else:
            already_scored_norms.add(_norm_filename(key))

    # Compute unscored normalized names
    scorable_unscored_norms = sorted(list(folder_norms - already_scored_norms))
    to_score_files = [norm_to_actual[n] for n in scorable_unscored_norms]

    if not to_score_files:
        merged = _merge_scores_into_applicants(applicants, score_doc)
        print(f"[score_job_applicants] Requirement '{requirement_id}': newly_scored=0, already_scored={len(already_scored_norms)}")
        return {
            "job": {
                "id": str(job["_id"]),
                "requirement_id": requirement_id,
                "title": job.get("title"),
                "location": job.get("location"),
                "workmode": job.get("workmode"),
                "description": job.get("description"),
                "opening_date": job.get("opening_date"),
                "closing_date": job.get("closing_date"),
                "status": job.get("status"),
                "slots": job.get("slots"),
                "jd": job.get("jd"),
            },
            "applicants": merged,
            "debug": {"stored_new": 0, "already_scored": len(already_scored_norms)},
        }

    # Run the scoring flow ONLY for unscored files in this folder
    try:
        results = run_scoring_flow(
            job_id=requirement_id,
            files=to_score_files,
            resume_dir=folder_path
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

    # Merge only NEW scores into DB: scores.<base>.<ext>
    now = _now_iso()
    set_updates = {}
    stored_new = 0

    for r in results or []:
        raw_fn = r.get("file")
        sc = r.get("scores", {})
        if not raw_fn:
            continue

        fn_norm = _norm_filename(raw_fn)
        if fn_norm not in scorable_unscored_norms:
            # Safety: ignore any file not in our intended subset
            continue

        actual_fn = norm_to_actual.get(fn_norm, raw_fn)
        base_name, ext = os.path.splitext(actual_fn)
        ext_key = (ext or "").lstrip(".").lower()  # "txt" | "pdf" | "docx"

        def fnum(x):
            try:
                return float(x)
            except Exception:
                return None

        entry = {
            "skills_score": fnum(sc.get("skills_score")),
            "education_score": fnum(sc.get("education_score")),
            "experience_score": fnum(sc.get("experience_score")),
            "overall_score": fnum(sc.get("overall_score")),
            "reason": sc.get("reason"),
            "scored_at": now,
        }

        set_updates[f"scores.{base_name}.{ext_key}"] = entry
        stored_new += 1

    if set_updates:
        set_updates["updated_at"] = now
        scores_col.update_one(
            {"job_id": ObjectId(job_id), "requirement_id": requirement_id},
            {"$set": set_updates, "$setOnInsert": {"created_at": score_doc.get("created_at", now)}},
            upsert=True
        )

    # Return merged applicants view
    score_doc = scores_col.find_one({"job_id": ObjectId(job_id), "requirement_id": requirement_id})
    merged = _merge_scores_into_applicants(applicants, score_doc)

    print(f"[score_job_applicants] Requirement '{requirement_id}': newly_scored={stored_new}, already_scored={len(already_scored_norms)}, results_returned={len(results or [])}")

    return {
        "job": {
            "id": str(job["_id"]),
            "requirement_id": requirement_id,
            "title": job.get("title"),
            "location": job.get("location"),
            "workmode": job.get("workmode"),
            "description": job.get("description"),
            "opening_date": job.get("opening_date"),
            "closing_date": job.get("closing_date"),
            "status": job.get("status"),
            "slots": job.get("slots"),
            "jd": job.get("jd"),
        },
        "applicants": merged,
        "debug": {
            "stored_new": stored_new,
            "already_scored": len(already_scored_norms),
            "results_returned": len(results or []),
        }
    }
