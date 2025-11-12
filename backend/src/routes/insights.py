from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import Optional
from src.db_connection import get_db
from src.llm.insights import run_insights_flow
# from src.models.my_logger import logger

router = APIRouter(prefix="/v1/insights", tags=["insight"])

def to_object_id(value: str, field_name: str) -> ObjectId:
    """
    Convert a string to ObjectId, raising a 400 if invalid.
    """
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid ObjectId for {field_name}")
    return ObjectId(value)

@router.get("/{job_id}/{applicant_id}")
def get_insights(job_id: str, applicant_id: str):
    print("Backend Call Successful")

    if job_id == "undefined":
        print("Fail")
        # logger.error("Data Missing", extra={
        #     "exception_type": "ValueError",
        #     "status_code": 500,
        #     "tags": ["runtime", "main"]
        # })

    try:
        db = get_db()
        insights_collection = db["insights"]
        jobs_collection = db["jobs"]

        # 1) Convert path params to ObjectId if your DB stores them as ObjectId
        job_oid = to_object_id(job_id, "job_id")

        # If your applicants collection uses ObjectId for applicant_id, do this:
        # applicant_oid = to_object_id(applicant_id, "applicant_id")
        # If applicant_id is a string in DB, keep as-is:
        applicant_key: Optional[ObjectId | str] = applicant_id

        # 2) Load Job doc by _id
        job_doc = jobs_collection.find_one({"_id": job_oid})
        if not job_doc:
            raise HTTPException(status_code=404, detail="Job not found")

        # 3) Extract requirement_id
        #    - If requirement_id is stored as ObjectId, keep it as ObjectId
        #    - If it's stored as a string, you can leave it as string
        if "requirement_id" not in job_doc:
            raise HTTPException(status_code=404, detail="Requirement ID not found for given Job ID")

        requirement_id = job_doc["requirement_id"]  # could be ObjectId or string

        print("Resolved job_id:", job_oid)
        print("applicant_id:", applicant_key)
        print("requirement_id:", requirement_id)

        # 4) Check if insights already exist.
        #    Choose a consistent schema. Here we store both job_id (_id) and requirement_id.
        #    Query primarily by (requirement_id, applicant_id) if your insights are per requirement.
        existing_insight = insights_collection.find_one({
            "requirement_id": requirement_id,
            "applicant_id": applicant_key,
        })

        # scores_collection = get_db()["job_scores"]

        # score_doc = scores_collection.find_one({"requirement_id" : requirement_id})

        # print("My Stuff :", score_doc["scores"][applicant_id])

        if existing_insight:
            return {
                "status": "success",
                "data": existing_insight.get("data")
            }

        # 5) Generate insights (your business logic)
        print("Phata: ", requirement_id, " ", applicant_key)

        result = run_insights_flow(requirement_id, applicant_key)

        # scores_collection = get_db()["job_scores"]

        # score_doc = scores_collection.find_one({"requirement_id" : requirement_id})

        # print("My Stuff :", score_doc["scores"][applicant_id])

        # 6) Store result with consistent keys
        insights_collection.insert_one({
            "job_id": job_oid,                  # actual MongoDB _id of job
            "requirement_id": requirement_id,   # requirement reference (ObjectId or string as stored in jobs)
            "applicant_id": applicant_key,      # applicant identifier (ObjectId or string)
            "data": result
        })

        return {
            "status": "success",
            "data": result
        }

    except HTTPException:
        # Re-raise known client errors
        raise
    except Exception as e:
        # Unexpected errors
        
        # logger.error("Data Missing", extra={
        #     "exception_type": "ValueError",
        #     "status_code": 500,
        #     "tags": ["runtime", "main"]
        # })

        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")