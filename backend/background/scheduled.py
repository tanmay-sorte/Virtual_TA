# from apscheduler.schedulers.background import BackgroundScheduler
# from fastapi import Request
# import os
# from bson import ObjectId
# from src.llm.resume_scoring import score_job_applicants
# #  _list_all_jobs, _get_request_context

# RESUME_BASE_PATH = r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"

# def _list_all_jobs():
#     jobs = []
#     for folder_name in os.listdir(RESUME_BASE_PATH):
#         folder_path = os.path.join(RESUME_BASE_PATH, folder_name)
#         if os.path.isdir(folder_path):
#             try:
#                 jobs.append({
#                     "_id": ObjectId(folder_name),  # or just folder_name if not using ObjectId
#                     "requirement_id": folder_name
#                 })
#             except Exception as e:
#                 print(f"Skipping folder '{folder_name}': {e}")
#     return jobs



# def background_scoring_job():
#     print("[Background Job] Checking for new resumes to score...")
#     jobs = _list_all_jobs()  # You need to implement this to return all job_ids

#     for job in jobs:
#         job_id = str(job["_id"])
#         try:
#             request = _get_request_context()  # Create a dummy or real Request object
#             score_job_applicants(job_id, request)
#         except Exception as e:
#             print(f"[Background Job] Failed scoring for job_id={job_id}: {e}")

# # Schedule the job
# scheduler = BackgroundScheduler()
# scheduler.add_job(background_scoring_job, 'interval', minutes=10)  # Run every 10 minutes
# scheduler.start()
