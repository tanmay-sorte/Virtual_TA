from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

def local_to_utc(date_str: str, time_str: str, tz_name: str):
    """
    date_str: 'YYYY-MM-DD'
    time_str: 'HH:MM'
    tz_name:  IANA tz, e.g., 'Asia/Kolkata'
    Returns: aware UTC datetime
    """
    # Basic parsing
    y, m, d = map(int, date_str.split("-"))
    hh, mm = map(int, time_str.split(":"))
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        raise ValueError(f"Invalid timeZone: {tz_name}")

    local_dt = datetime(y, m, d, hh, mm, 0, tzinfo=tz)
    return local_dt.astimezone(ZoneInfo("UTC"))