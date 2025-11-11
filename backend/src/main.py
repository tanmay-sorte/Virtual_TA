from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.routes import auth, jobs, interview, panelist, ics_download, insights, resume
from fastapi.middleware.cors import CORSMiddleware
# from src.routes.jobs import ensure_job_indexes
from src.db_connection import get_db
from fastapi.staticfiles import StaticFiles

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials =True,
    allow_methods = ["*"],
    allow_headers=["*"],
)

# ensure_job_indexes()


app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(interview.router)
app.include_router(panelist.router)
app.include_router(ics_download.router)
app.include_router(interview.list_router)
app.include_router(insights.router)
app.include_router(resume.router)

BASE_RESUME_PATH = r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"
app.mount("/static/resumes", StaticFiles(directory=BASE_RESUME_PATH), name="resumes")