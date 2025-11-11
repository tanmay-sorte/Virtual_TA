import os
import json
import re
import numpy as np
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from openai import AzureOpenAI
from typing import TypedDict, Any, Dict
from PyPDF2 import PdfReader
import docx
import time

load_dotenv()

client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_PROJECT_ENDPOINT"),
    api_version=os.getenv("api_version"),
    api_key=os.getenv("subscription_key"),
)

class InsightsState(TypedDict):
    job_id: str
    applicant_id: str
    jd: dict                 # Parsed JD JSON from jd_data.json
    resume_ext : list
    results: dict[str, Any]

BASE_RESUME_PATH = r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"
IGNORED_BASENAMES = {"jd_data", "jd_embedding"}  # ignore these regardless of extension

def load_jd(inputs: InsightsState):
    job_id = inputs["job_id"]
    folder_path = os.path.join(BASE_RESUME_PATH, job_id)

    jd_data_path = os.path.join(folder_path, "jd_data.json")
    if not os.path.isfile(jd_data_path):
        raise FileNotFoundError(f"JD file not found: {jd_data_path}")

    with open(jd_data_path, "r", encoding="utf-8") as f:
        jd_data = json.load(f)


    print("load_jd completed")

    return {
        "job_id": job_id,
        "applicant_id": inputs["applicant_id"],
        "jd": jd_data,
        "resume_ext": [],
        "results": [],
    }


# job: {
#       id: ,
#       title: ,
#       location: ,
#       seniority: ,
#       jdHighlights: ,
#     },
#     applicant: {
#       id: applicationId,
#       name: "Priya Sharma",
#       expYears: 5.8,
#       currentRole: "Frontend Engineer @ ProductCo",
#       resumeSummary:
#         "Experienced frontend engineer with strong React ecosystem expertise, component design, and UI performance tuning. Led UI rewrites and accessibility improvements.",
#     },
#     scores: {
#       overall,
#       skillsMatch,
#       jdCoverage,
#     },
#     skills: {
#       matched: [
#         { name: "React", level: "Advanced", weight: 0.9, score: 92 },
#         { name: "TypeScript", level: "Intermediate", weight: 0.7, score: 78 },
#         { name: "TailwindCSS", level: "Intermediate", weight: 0.6, score: 75 },
#         { name: "Accessibility (a11y)", level: "Intermediate", weight: 0.6, score: 72 },
#       ],
#       gaps: [
#         { name: "Jest / RTL", importance: "High", reason: "JD emphasizes unit/integration testing and coverage." },
#         { name: "System Design (Front-End)", importance: "Medium", reason: "Expected for senior roles: architecture & trade-offs." },
#         { name: "Web Vitals Deep-Dive", importance: "Medium", reason: "JD references Core Web Vitals & perf budgets." },
#       ],
#       extras: [
#         { name: "Storybook", relevance: "High" },
#         { name: "GraphQL", relevance: "Medium" },
#         { name: "Vite", relevance: "Medium" },
#       ],
#     },
#     questions: [
#       {
#         category: "React + Architecture",
#         items: [
#           "Walk through a component architecture you designed—state boundaries & rendering strategy.",
#           "How do you approach code-splitting and route-level performance?",
#         ],
#       },
#       {
#         category: "Testing",
#         items: [
#           "How would you structure tests for a complex form with async validation?",
#           "When do you prefer RTL vs. Cypress and why?",
#         ],
#       },
#       {
#         category: "Accessibility & Performance",
#         items: [
#           "How do you track and improve Core Web Vitals across releases?",
#           "Give examples of a11y issues you proactively guard against.",
#         ],
#       },
#       {
#         category: "System Design",
#         items: [
#           "Design a scalable design system for multiple microfrontends: tokens, theming, and governance.",
#         ],
#       },
#     ],
#     clarifications: [
#       "Depth of hands-on testing experience (frameworks, coverage, CI integration).",
#       "Exposure to front-end system design in production contexts.",
#       "Examples of measurable performance improvements (before/after + tooling).",
#     ],
#     highlights: [
#       "Strong React fundamentals and component patterns.",
#       "Hands-on a11y improvements with clear user impact.",
#       "Experience leading UI refactors and design system adoption.",
#     ],
#     redFlags: [
#       "Limited evidence of structured test strategy.",
#       "System design exposure appears limited to small-scale features.",
#     ],
#   };


def coerce_to_json(text: str) -> dict:
    # Strip code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"```$", "", text).strip()

    # Extract the largest {...} block (in case the model added extra text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start:end+1]

    # Final parse
    return json.loads(text)


def extract_text_from_file(base_path: str, filename : str):
    extensions = [".txt", ".pdf", ".docx"]
    for ext in extensions:
        path = os.path.join(base_path, filename + ext)
        
        if not os.path.exists(path):
            continue

        if ext == ".txt":
            try:
                with open(path, "r") as f:
                    return f.read()
            except:
                continue

        if ext == ".pdf":
            reader = PdfReader(path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        
        if ext == ".docx":
            doc = docx.Document(path)
            return "\n".join(p.text for p in doc.paragraphs)

def load_resume(inputs : InsightsState):
    resume_dir = os.path.join(BASE_RESUME_PATH, inputs["job_id"])

    inputs["resume_ext"] = extract_text_from_file(resume_dir, inputs["applicant_id"])

    return inputs

def extract_insights(inputs : InsightsState):
    prompt = f"""
You are an expert recruiter analyzer. You are given:

    - Job Description: {inputs['jd']}
    - Resume Text: {inputs['resume_ext']}

Based on these two files, analyze the resume with respect
to the job description and provide insights. Return the output
in the following JSON format:

{{
  "job": {{
    "id": "",
    "title": "",
    "location": "",
    "department": "",
    "seniority": "",
    "jdHighlights": []
  }},
  "applicant": {{
    "id": "",
    "name": "",
    "expYears": 0,
    "currentRole": "",
    "resumeSummary": ""
  }},
  "scores": {{
    "overall": 0,
    "skillsMatch": 0,
    "jdCoverage": 0
  }},
  "skills": {{
    "matched": [],
    "gaps": [],
    "extras": []
  }},
  "questions": [
    {{
      "category": "",
      "items": []
    }}
  ],
  "clarifications": [],
  "highlights": [],
  "redFlags": []
}}



Instructions:
- Return ONLY valid JSON. No explanations, no markdown, no code fences.
- Use the exact keys and structure shown.
- Strings must use double quotes. No trailing commas.
- If information is missing, use "" or [] (do not invent data).

"""

    start = time.time()
    response = client.chat.completions.create(
        model= os.getenv("DEPLOYMENT"),
        messages= [{"role":"user", "content" : prompt}],
        max_completion_tokens= 20000,
    )
    latency = time.time() - start
    print(f"""Individual Resume Scoring: (prompt) {response.usage.prompt_tokens} (completion) {response.usage.completion_tokens} (total) {response.usage.total_tokens}
                Latency: {latency} s""")
    

    insight = response.choices[0].message.content

    insight = coerce_to_json(insight)

    inputs["results"] = insight

    return inputs


graph = StateGraph(InsightsState)
graph.add_node("load_jd", load_jd)
graph.add_node("load_resume", load_resume)
graph.add_node("insights", extract_insights)

graph.add_edge(START, "load_jd")
graph.add_edge("load_jd", "load_resume")
graph.add_edge("load_resume", "insights")
graph.add_edge("insights", END)

insight_extract = graph.compile()


# if __name__ == "__main__":
#     inputs: InsightsState = {"job_id": "REQ-2025-1801", "applicant_id": "resume_60_percent", "jd": {}, "resume_ext": [], "results": []}
#     output = insight_extract.invoke(inputs)
#     print(output)

def run_insights_flow(job_id: str, applicant_id: str):
    """
    Public API for others (FastAPI) to call.
    This MUST pass a DICT to `scoring_flow.invoke` and return the results list.
    """
    # IMPORTANT: `invoke` expects a dict, not a list
    inputs: InsightsState = {"job_id": job_id, "applicant_id": applicant_id, "jd": {}, "resume_ext": [], "results": []}
    output = insight_extract.invoke(inputs)  # <-- this is valid: compiled graph has .invoke()
    return output["results"]  # list of {"file": ..., "scores": {...}}