# backend/scripts/seed_jobs_min.py
from datetime import datetime
from bson import ObjectId

# ⬇️ Adjust to where your get_db is actually defined
from src.db_connection import get_db
# Optional: If you created ensure_job_indexes() in routes/jobs.py, import & call it.
try:
    from src.routes.jobs import ensure_job_indexes  # if available
except Exception:
    ensure_job_indexes = None

def ymd(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%d")

SEED = [
    {
        "requirement_id": "REQ-2025-0101",
        "title": "Frontend Engineer (React + Tailwind)",
        "opening_date": ymd("2025-10-15"),
        "closing_date": ymd("2025-11-30"),
        "applicants_count": 5,
        "slots": 2,
        "status": "open",
    },
    {
        "requirement_id": "REQ-2025-0102",
        "title": "Backend Engineer (FastAPI)",
        "opening_date": ymd("2025-10-20"),
        "closing_date": ymd("2025-12-05"),
        "applicants_count": 3,
        "slots": 1,
        "status": "open",
    },
    {
        "requirement_id": "REQ-2025-0103",
        "title": "Data Engineer (MongoDB)",
        "opening_date": ymd("2025-10-25"),
        "closing_date": ymd("2025-12-10"),
        "applicants_count": 0,
        "slots": 1,
        "status": "on_hold",
    },
]

def run():
    db = get_db()
    coll = db["jobs"]

    # Create indexes if you have the helper
    if ensure_job_indexes:
        try:
            ensure_job_indexes()
        except Exception as ex:
            print(f"Index creation skipped ({ex})")

    for d in SEED:
        doc = {
            **d,
            "_id": ObjectId(),  # set on first insert; ignored on upsert if exists
            "description": d.get("description", ""),
            "department": d.get("department", ""),
            "location": d.get("location", ""),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        # Upsert by requirement_id so re-running the script doesn't duplicate
        coll.update_one(
            {"requirement_id": d["requirement_id"]},
            {"$setOnInsert": doc},
            upsert=True,
        )

    print(f"Seeded (or verified) {len(SEED)} jobs. Total now: {coll.count_documents({})}")

if __name__ == "__main__":
    run()