from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from src.db_connection import get_db

router = APIRouter(prefix="/v1/panelists", tags=["panelists-global"])

class Panelist(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    active: bool = True

class PanelistUpsertMany(BaseModel):
    panelists: List[Panelist] = Field(default_factory=list)

@router.get("", response_model=List[Panelist])
def list_panelists(
    q: Optional[str] = Query(None, description="search by name or email (case-insensitive)"),
    active: Optional[bool] = Query(None, description="filter by active flag"),
    limit: int = Query(200, ge=1, le=1000),
    skip: int = Query(0, ge=0),
):
    db = get_db()
    criteria = {}
    if active is not None:
        criteria["active"] = active
    if q:
        # simple case-insensitive search
        criteria["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    cur = db.panelists_master.find(criteria, {"_id": 0}).skip(skip).limit(limit)
    return list(cur)

@router.post("", response_model=List[Panelist])
def upsert_many(body: PanelistUpsertMany):
    if not body.panelists:
        return []
    db = get_db()
    out = []
    for p in body.panelists:
        doc = p.model_dump()
        db.panelists_master.update_one(
            {"email": p.email.lower()},
            {"$set": {**doc, "email": p.email.lower()}},
            upsert=True,
        )
        out.append({**doc, "email": p.email.lower()})
    return out

@router.put("/{email}", response_model=Panelist)
def update_one(email: str, patch: Panelist):
    db = get_db()
    # We trust body for fields; path param decides which record to change
    patch_doc = patch.model_dump()
    patch_doc["email"] = patch.email.lower()  # normalize
    res = db.panelists_master.find_one_and_update(
        {"email": email.lower()},
        {"$set": patch_doc},
        upsert=True,
        projection={"_id": 0},
        return_document=True,
    )
    return res

@router.delete("/{email}")
def delete_one(email: str):
    db = get_db()
    db.panelists_master.delete_one({"email": email.lower()})
    return {"ok": True}