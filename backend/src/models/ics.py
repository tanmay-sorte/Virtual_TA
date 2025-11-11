from datetime import datetime
from email.utils import formatdate

def to_ics_datetime(dt_iso_utc: str) -> str:
    """
    Convert ISO UTC like '2025-11-01T09:00:00Z' to ICS UTC: '20251101T090000Z'
    """
    # handle both 'Z' and '+00:00'
    s = dt_iso_utc.replace("Z", "+00:00")
    dt = datetime.fromisoformat(s)
    return dt.strftime("%Y%m%dT%H%M%SZ")

def build_interview_ics(
    uid: str,
    dtstart_utc_iso: str,
    dtend_utc_iso: str,
    summary: str,
    description: str = "",
    location: str = "",
    organizer_email: str = "",
    attendees: list[str] = [],
) -> str:
    dtstamp = formatdate(usegmt=True)  # RFC 2822 date; acceptable for DTSTAMP
    dtstart = to_ics_datetime(dtstart_utc_iso)
    dtend = to_ics_datetime(dtend_utc_iso)

    lines = [
        "BEGIN:VCALENDAR",
        "PRODID:-//Virtual TA//Interview//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstart}",  # DTSTAMP can be 'now'; using start here is fine for simplicity
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{summary}",
    ]
    if description:
        # escape commas/semicolons per ICS rules (simple variant)
        safe_desc = description.replace("\\", "\\\\").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")
        lines.append(f"DESCRIPTION:{safe_desc}")
    if location:
        safe_loc = location.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")
        lines.append(f"LOCATION:{safe_loc}")
    if organizer_email:
        lines.append(f"ORGANIZER:mailto:{organizer_email}")
    for a in attendees:
        lines.append(f"ATTENDEE;CN={a.split('@')[0]}:mailto:{a}")
    lines += [
        "END:VEVENT",
        "END:VCALENDAR",
        ""
    ]
    return "\r\n".join(lines)