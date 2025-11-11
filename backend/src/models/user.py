from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from typing import Optional, Literal, Annotated
from datetime import datetime, date


class UserInDB(BaseModel):
    name : str
    email : EmailStr
    password_hash : str
    role : str = "recruiter"
    created_by : str = "admin"
    created_at : datetime = Field(default_factory=datetime.now())
    modified_at : datetime = Field(default_factory=datetime.now())


# class JobCreate(BaseModel):
#     requirement_id: str = Field(..., min_length=1)
#     title: str = Field(..., min_length=1)
#     opening_date: date
#     closing_date: date
#     location: str = Field(..., min_length=1)
#     workmode: str = Field(..., min_length=1)
#     slots: int = Field(..., ge=1)
#     status: Literal["open", "closed"]
#     jd: str





MIN_SEGMENT = 5

class Weightage(BaseModel):
    skills: Annotated[int, Field(ge=0, le=100)]
    experience: Annotated[int, Field(ge=0, le=100)]
    education: Annotated[int, Field(ge=0, le=100)]

    @model_validator(mode="after")
    def validate_total_and_min_segment(self):
        total = self.skills + self.experience + self.education
        if total != 100:
            raise ValueError(f"Weightage must sum to 100. Got {total}.")
        for label, val in (("skills", self.skills), ("experience", self.experience), ("education", self.education)):
            if val < MIN_SEGMENT:
                raise ValueError(f"Weightage for '{label}' must be at least {MIN_SEGMENT}. Got {val}.")
        return self


class JobCreate(BaseModel):
    # requirement_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    opening_date: date
    closing_date: Optional[date] = None
    location: str = Field(..., min_length=1)
    workmode: str = Field(..., min_length=1)
    slots: int = Field(..., ge=1)
    status: Literal["open", "closed"]
    jd: str = Field(..., min_length=1)
    weightage: Weightage



def to_ymd(value) -> str:
    if not value:
        return "-"
    try:
        if isinstance(value, (datetime,)):
            dt = value
        else:
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return str(value)

class JobOut(BaseModel):
    id: str = Field(..., description="Stringified ObjectId")
    requirement_id: Optional[str] = "-"
    title: Optional[str] = "-"
    opening_date: Optional[str] = "-"
    closing_date: Optional[str] = "-"
    applicants_count: int = 0
    slots: int = 0
    status: str = "open"

class JobsResponse(BaseModel):
    items: list[JobOut]
    total: int


class JobUpdate(BaseModel):
    requirement_id: Optional[str] = Field(None, min_length=1)
    title: Optional[str] = Field(None, min_length=1)
    location: Optional[str] = Field(None, min_length=1)
    workmode: Optional[str] = Field(None, min_length=1)
    opening_date: Optional[date]
    closing_date: Optional[date]
    slots: Optional[int] = Field(None, ge=1)
    status: Optional[Literal["open", "closed", "on-hold"]]
    jd: Optional[str]
    weightage: Weightage



# class JobUpdate(BaseModel):
#     # NOTE: UI says "Requirement ID cannot be changed".
#     # We'll allow it to be present in payload but will reject if it differs from stored one.
#     requirement_id: Optional[str] = Field(None, min_length=1)

#     title: Optional[str] = Field(None, min_length=1)
#     location: Optional[str] = Field(None, min_length=1)
#     workmode: Optional[str] = Field(None, min_length=1)

#     opening_date: Optional[date] = None
#     closing_date: Optional[date] = None

#     slots: Optional[Annotated[int, Field(ge=1)]] = None
#     status: Optional[Literal["open", "closed", "on-hold"]] = None

#     jd: Optional[str] = Field(None, min_length=1)

#     # NEW: optional weightage block
#     weightage: Optional[Weightage] = None

#     @model_validator(mode="after")
#     def validate_dates(self):
#         if self.opening_date and self.closing_date and self.closing_date < self.opening_date:
#             raise ValueError("closing_date must be on or after opening_date.")
#         return self


