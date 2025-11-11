# app/routes/interviews.py
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from src.db_connection import get_db

router = APIRouter(prefix="/v1/jobs", tags=["interviews"])

# ---------- Helpers ----------

def local_to_utc(date_str: str, time_str: str, tz_name: str) -> datetime:
    """
    Convert a local date/time with IANA timezone to an aware UTC datetime.
    date_str: 'YYYY-MM-DD'
    time_str: 'HH:MM'
    tz_name:  e.g., 'Asia/Kolkata'
    """
    try:
        y, m, d = map(int, date_str.split("-"))
        hh, mm = map(int, time_str.split(":"))
    except Exception:
        raise ValueError("Invalid start date/time format. Expected 'YYYY-MM-DD' and 'HH:MM'.")

    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        raise ValueError(f"Invalid timeZone: {tz_name}")

    local_dt = datetime(y, m, d, hh, mm, 0, tzinfo=tz)
    return local_dt.astimezone(ZoneInfo("UTC"))

# ---------- Schemas ----------

class Panelist(BaseModel):
    name: Optional[str] = None
    email: EmailStr

class StartBlock(BaseModel):
    date: str      # 'YYYY-MM-DD'
    time: str      # 'HH:MM'
    timeZone: str  # IANA TZ, e.g., 'Asia/Kolkata'

class ScheduleIn(BaseModel):
    start: StartBlock
    durationMinutes: int = Field(gt=0, le=8 * 60)
    mode: Literal["video", "onsite", "phone"]
    meetingLink: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    panelists: List[Panelist] = Field(default_factory=list)

class InterviewOut(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    start_utc: str
    end_utc: str
    mode: str
    meetingLink: Optional[str] = None
    location: Optional[str] = None
    panelists: List[Panelist] = Field(default_factory=list)
    ics_url: Optional[str] = None
    status: Optional[str] = None

# ---------- Route ----------

@router.post("/{job_id}/applicants/{applicant_id}/schedule", response_model=InterviewOut)
async def schedule_interview(job_id: str, applicant_id: str, body: ScheduleIn, request: Request):
    """
    Schedule an interview for a given job/applicant.
    - Requires at least one panelist.
    - For mode=video: meetingLink is required.
    - For mode=onsite: location is required.
    - Converts local start time to UTC and persists the interview.
    - Returns an ICS download URL.
    """

    # Uncomment to debug raw body if you run into JSON issues:
    # raw = await request.body()
    # print("RAW BODY>", raw.decode("utf-8", errors="replace"))

    # Basic validations
    if not body.panelists:
        raise HTTPException(status_code=400, detail="At least one panelist is required")

    if body.mode == "video" and not (body.meetingLink and body.meetingLink.strip()):
        raise HTTPException(status_code=400, detail="meetingLink required for video mode")

    if body.mode == "onsite" and not (body.location and body.location.strip()):
        raise HTTPException(status_code=400, detail="location required for onsite mode")

    # Convert to UTC
    try:
        start_utc_dt = local_to_utc(body.start.date, body.start.time, body.start.timeZone)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    end_utc_dt = start_utc_dt + timedelta(minutes=body.durationMinutes)

    # Normalize panelists (emails to lower-case)
    norm_panelists = [{"name": p.name, "email": p.email.lower()} for p in body.panelists]

    db = get_db()

    # OPTIONAL: validate that panelists exist in global directory
    # emails = [p["email"] for p in norm_panelists]
    # count = db.panelists_master.count_documents({"email": {"$in": emails}})
    # if count != len(emails):
    #     raise HTTPException(status_code=400, detail="One or more panelists not found in global directory")

    interview_id = uuid4().hex
    start_utc_iso = start_utc_dt.isoformat().replace("+00:00", "Z")
    end_utc_iso = end_utc_dt.isoformat().replace("+00:00", "Z")

    doc = {
        "id": interview_id,
        "job_id": job_id,
        "applicant_id": applicant_id,
        "start_utc": start_utc_iso,
        "end_utc": end_utc_iso,
        "mode": body.mode,
        "meetingLink": (body.meetingLink or None),
        "location": (body.location or None),
        "notes": (body.notes or None),
        "panelists": norm_panelists,
        "start_local": {
            "date": body.start.date,
            "time": body.start.time,
            "timeZone": body.start.timeZone,
        },
        "created_at": datetime.utcnow().isoformat() + "Z",
        "status" : "completed",
    }

    db.interviews.insert_one(doc)

    # (Optional) Persist last-used panelists for this candidate (handy for prefill)
    # db.panelists.update_one(
    #     {"job_id": job_id, "applicant_id": applicant_id},
    #     {"$set": {"panelists": norm_panelists}},
    #     upsert=True,
    # )

    ics_url = f"/v1/interviews/{interview_id}/ics"

    return {
        "id": interview_id,
        "job_id": job_id,
        "applicant_id": applicant_id,
        "start_utc": start_utc_iso,
        "end_utc": end_utc_iso,
        "mode": body.mode,
        "meetingLink": doc["meetingLink"],
        "location": doc["location"],
        "panelists": norm_panelists,
        "ics_url": ics_url,
    }


# If this file already defines `router = APIRouter(prefix="/v1/jobs", tags=["interviews"])`
# create a SECOND router for collection-level paths under /v1/interviews:
list_router = APIRouter(prefix="/v1/interviews", tags=["interviews"])

# @list_router.get("")
# def list_interviews(
#     job_id: Optional[str] = Query(None),
#     applicant_id: Optional[str] = Query(None),
#     mode: Optional[Literal["video", "onsite", "phone"]] = Query(None),
#     # NEW: explicit completed flag; upcoming remains as before
#     upcoming: Optional[bool] = Query(None, description="If true, only future interviews (start_utc >= now)"),
#     completed: Optional[bool] = Query(None, description="If true, only past interviews (end_utc <= now)"),
#     from_utc: Optional[str] = Query(None, description="ISO UTC (inclusive), range lower bound on start_utc"),
#     to_utc: Optional[str] = Query(None, description="ISO UTC (inclusive), range upper bound on start_utc"),
#     limit: int = Query(50, ge=1, le=200),
#     skip: int = Query(0, ge=0),
# ):
#     """
#     Returns a paginated list of interviews.
#     Filters:
#       - job_id, applicant_id, mode
#       - upcoming=true => start_utc >= now
#       - completed=true => end_utc <= now
#       - from_utc/to_utc => range on start_utc (inclusive)
#     Sorted by start_utc DESC.
#     """
#     db = get_db()
#     criteria = {}

#     if job_id:
#         criteria["job_id"] = job_id
#     if applicant_id:
#         criteria["applicant_id"] = applicant_id
#     if mode:
#         criteria["mode"] = mode

#     # You can store *_utc as ISO strings (e.g., '2025-11-01T09:00:00Z') OR as Mongo Date objects.
#     # This code supports both by building query values in the same representation consistently.
#     now_dt = datetime.now(timezone.utc)
#     now_iso = now_dt.isoformat().replace("+00:00", "Z")

#     # Detect representation by checking one doc quickly (optional micro‑optimization)
#     # But usually, consistent storage is best; if you always store strings, use `now_iso`,
#     # if you store datetimes, use `now_dt`.
#     use_string = True
#     sample = db.interviews.find_one({}, {"_id": 0, "start_utc": 1})
#     if sample and not isinstance(sample.get("start_utc"), str):
#         use_string = False

#     now_value = now_iso if use_string else now_dt

#     # Time classification
#     if upcoming and completed:
#         # Avoid conflicting filters
#         raise HTTPException(status_code=400, detail="Cannot request both upcoming=true and completed=true")

#     # Range on start_utc (inclusive)
#     if from_utc or to_utc:
#         # Parse to the same representation as in DB
#         if use_string:
#             range_val = {}
#             if from_utc:
#                 range_val["$gte"] = from_utc
#             if to_utc:
#                 range_val["$lte"] = to_utc
#             criteria["start_utc"] = range_val
#         else:
#             try:
#                 range_val = {}
#                 if from_utc:
#                     range_val["$gte"] = datetime.fromisoformat(from_utc.replace("Z", "+00:00"))
#                 if to_utc:
#                     range_val["$lte"] = datetime.fromisoformat(to_utc.replace("Z", "+00:00"))
#                 criteria["start_utc"] = range_val
#             except Exception:
#                 raise HTTPException(status_code=400, detail="Invalid from_utc/to_utc format")

#     # Upcoming vs Completed flags
#     if upcoming is True:
#         # upcoming: start_utc >= now
#         # If a range exists already, merge it
#         cond = criteria.get("start_utc", {})
#         cond["$gte"] = max(cond.get("$gte", now_value), now_value) if "$gte" in cond else now_value
#         criteria["start_utc"] = cond

#     if completed is True:
#         # completed: end_utc <= now
#         # This uses end_utc because an interview whose start < now but end > now is in-progress
#         if use_string:
#             criteria["end_utc"] = {"$lte": now_iso}
#         else:
#             criteria["end_utc"] = {"$lte": now_dt}

#     # Query + sort
#     cursor = (
#         db.interviews.find(criteria, {"_id": 0})
#         .sort([("start_utc", -1)])
#         .skip(skip)
#         .limit(limit)
#     )
#     items = list(cursor)
#     total = db.interviews.count_documents(criteria)

#     return {
#         "items": items,
#         "total": total,
#         "limit": limit,
#         "skip": skip,
#         "criteria": criteria,  # helpful during testing; remove in prod if you prefer
#     }

@list_router.get("")
def list_interviews(
    job_id: Optional[str] = Query(None),
    applicant_id: Optional[str] = Query(None),
    mode: Optional[Literal["video", "onsite", "phone"]] = Query(None),
    # explicit completed flag; upcoming remains as before
    upcoming: Optional[bool] = Query(None, description="If true, only future interviews (start_utc >= now)"),
    completed: Optional[bool] = Query(None, description="If true, only past interviews (end_utc <= now)"),
    from_utc: Optional[str] = Query(None, description="ISO UTC (inclusive), range lower bound on start_utc"),
    to_utc: Optional[str] = Query(None, description="ISO UTC (inclusive), range upper bound on start_utc"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
):
    """
    Returns a paginated list of interviews.
    Filters:
      - job_id, applicant_id, mode
      - upcoming=true => start_utc >= now
      - completed=true => end_utc <= now
      - from_utc/to_utc => range on start_utc (inclusive)
    Sorted by start_utc DESC.

    NOTE: requirement_id is joined from a different collection via $lookup (job_id -> requirement_id).
    """
    db = get_db()
    criteria: dict = {}

    # --- Basic filters on interviews collection ---
    if job_id:
        criteria["job_id"] = job_id
    if applicant_id:
        criteria["applicant_id"] = applicant_id
    if mode:
        criteria["mode"] = mode

    # --- Time representation detection (strings vs Date objects) ---
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat().replace("+00:00", "Z")

    use_string = True
    sample = db.interviews.find_one({}, {"_id": 0, "start_utc": 1})
    if sample and not isinstance(sample.get("start_utc"), str):
        use_string = False

    now_value = now_iso if use_string else now_dt

    # --- Guard conflicting flags ---
    if upcoming and completed:
        raise HTTPException(status_code=400, detail="Cannot request both upcoming=true and completed=true")

    # --- Range on start_utc (inclusive) ---
    if from_utc or to_utc:
        if use_string:
            range_val = {}
            if from_utc:
                range_val["$gte"] = from_utc
            if to_utc:
                range_val["$lte"] = to_utc
            criteria["start_utc"] = range_val
        else:
            try:
                range_val = {}
                if from_utc:
                    range_val["$gte"] = datetime.fromisoformat(from_utc.replace("Z", "+00:00"))
                if to_utc:
                    range_val["$lte"] = datetime.fromisoformat(to_utc.replace("Z", "+00:00"))
                criteria["start_utc"] = range_val
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid from_utc/to_utc format")

    # --- Upcoming vs Completed flags ---
    if upcoming is True:
        cond = criteria.get("start_utc", {})
        cond["$gte"] = max(cond.get("$gte", now_value), now_value) if "$gte" in cond else now_value
        criteria["start_utc"] = cond

    if completed is True:
        if use_string:
            criteria["end_utc"] = {"$lte": now_iso}
        else:
            criteria["end_utc"] = {"$lte": now_dt}

    # --- $lookup config: CHANGE THESE to match your schema ---
    LOOKUP_COLLECTION = "jobs"             # e.g., "jobs" or "requirements"
    FOREIGN_JOB_FIELD = "job_id"           # field in the lookup collection to match on
    FOREIGN_REQ_FIELD = "requirement_id"   # field in the lookup collection to return

    # --- Aggregation pipeline ---
    # We $match first to reduce docs, then sort/skip/limit, then $lookup for the page only.
    pipeline = [
        {"$match": criteria},
        {"$sort": {"start_utc": -1}},
        {"$skip": skip},
        {"$limit": limit},

        # Join other collection to fetch requirement_id by job_id
        {
            "$lookup": {
                "from": LOOKUP_COLLECTION,
                "localField": "job_id",
                "foreignField": FOREIGN_JOB_FIELD,
                "as": "req_docs",
            }
        },

        # Fill requirement_id from:
        # 1) interview.requirement_id if present
        # 2) else first req_docs.requirement_id
        {
            "$set": {
                "requirement_id": {
                    "$ifNull": [
                        "$requirement_id",
                        {"$arrayElemAt": [f"$req_docs.{FOREIGN_REQ_FIELD}", 0]},
                    ]
                }
            }
        },

        # Shape the outgoing document
        {
            "$project": {
                "_id": 1,              # keep for conversion to string ID for React keys (optional)
                "job_id": 1,           # keep or remove based on your needs
                "requirement_id": 1,   # <-- will be present via lookup/fallback
                "applicant_id": 1,
                "mode": 1,
                "start_utc": 1,
                "end_utc": 1,
                "location": 1,
                "panel": 1,
                "status": 1,
                "notes": 1,
                # do NOT project req_docs to avoid leaking the joined array
            }
        },
    ]

    docs = list(db.interviews.aggregate(pipeline))

    # Optional: expose "id" as string for React keys, and drop _id
    items = []
    for d in docs:
        if "_id" in d:
            d["id"] = str(d["_id"])
            d.pop("_id", None)
        items.append(d)

    total = db.interviews.count_documents(criteria)

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "skip": skip,
        "criteria": criteria,  # helpful during testing; remove in prod if you prefer
    }



AllowedStatus = Literal["completed", "no_show", "cancelled", "rescheduled"]

class StatusPatch(BaseModel):
    status: AllowedStatus = Field(...)

@list_router.patch("/{interview_id}/status")
def patch_status(interview_id: str, body: StatusPatch):
    db = get_db()
    doc = db.interviews.find_one_and_update(
        {"id": interview_id},
        {"$set": {"status": body.status}},
        projection={"_id": 0},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    return doc
