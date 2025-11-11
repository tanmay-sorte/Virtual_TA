from fastapi import APIRouter, HTTPException, Response
from src.db_connection import get_db
from src.models.ics import build_interview_ics

router = APIRouter(prefix="/v1/interviews", tags=["ics"])

@router.get("/{interview_id}/ics")
def download_ics(interview_id: str):
    db = get_db()
    doc = db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Build fields
    summary = f"Interview: {doc.get('job_id')} / {doc.get('applicant_id')}"
    description_parts = []
    if doc.get("mode") == "video" and doc.get("meetingLink"):
        description_parts.append(f"Meeting Link: {doc['meetingLink']}")
    if doc.get("notes"):
        description_parts.append(f"Notes: {doc['notes']}")
    description = "\n".join(description_parts)
    location = doc.get("location") or ""

    attendees = [p["email"] for p in doc.get("panelists", []) if "email" in p]

    ics_text = build_interview_ics(
        uid=doc["id"],
        dtstart_utc_iso=doc["start_utc"],
        dtend_utc_iso=doc["end_utc"],
        summary=summary,
        description=description,
        location=location,
        organizer_email="",   # supply later if you have auth/users
        attendees=attendees,
    )

    filename = f"interview_{interview_id}.ics"
    return Response(
        content=ics_text,
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )