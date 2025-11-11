import os
import json
import re
from typing import TypedDict, Any, Dict, List, Optional
import time
# import tiktoken

from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from openai import AzureOpenAI
from PyPDF2 import PdfReader
import docx

load_dotenv()

client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_PROJECT_ENDPOINT"),
    api_version=os.getenv("api_version"),
    api_key=os.getenv("subscription_key"),
)

# -----------------------------
# Config
# -----------------------------
BASE_RESUME_PATH = r"C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes"
IGNORED_BASENAMES = {"jd_data", "jd_embedding"}  # ignore these regardless of extension
SUPPORTED_EXTENSIONS = {".txt", ".pdf", ".docx"}  # <<< .doc intentionally excluded

# -----------------------------
# Helpers
# -----------------------------

# def estimate_token(prompt):
#     try:
#         encoding = tiktoken.encoding_for_model("gpt-5")
#     except KeyError:
#         print("Tiktoken gpt-5 not found")
#         encoding = tiktoken.get_encoding('cl100k_base')
#     return len(encoding.encode(prompt))


def _norm_filename(name: str) -> str:
    """
    Normalize filename for tolerant comparisons:
    - lowercase
    - collapse whitespace
    - treat spaces/dashes as underscores
    """
    if not name:
        return ""
    base = name.strip().lower()
    base = re.sub(r"[ \t\r\n]+", " ", base)
    base = base.replace(" ", "_").replace("-", "_")
    return base

def strip_to_json(text: str) -> str:
    """
    Remove Markdown fences and extract the first JSON object-ish payload.
    """
    if not text:
        return "{}"
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    m = re.search(r"\{.*\}", text, flags=re.DOTALL)
    return m.group(0) if m else text

# -----------------------------
# Typed state for LangGraph
# -----------------------------
class ScoringState(TypedDict, total=False):
    job_id: str
    jd: dict
    resume_dir: str
    resumes: list
    results: list
    # Optional extensions
    allowlist: List[str]          # only these files will be processed (relative names)
    resume_dir_override: str      # explicit directory path override

# -----------------------------
# Nodes
# -----------------------------
def load_jd(inputs: ScoringState) -> ScoringState:
    job_id = inputs["job_id"]

    folder_path = os.path.join(BASE_RESUME_PATH, job_id)
    # Allow explicit override from caller (backend)
    if inputs.get("resume_dir_override"):
        folder_path = inputs["resume_dir_override"]

    jd_data_path = os.path.join(folder_path, "jd_data.json")
    if not os.path.isfile(jd_data_path):
        raise FileNotFoundError(f"JD file not found: {jd_data_path}")

    with open(jd_data_path, "r", encoding="utf-8") as f:
        jd_data = json.load(f)

    print("load_jd completed")

    return {
        "job_id": job_id,
        "jd": jd_data,
        "resume_dir": folder_path,
        "resumes": [],
        "results": [],
        "allowlist": inputs.get("allowlist"),
        "resume_dir_override": inputs.get("resume_dir_override"),
    }

def load_resumes(inputs: Dict[str, Any]) -> Dict[str, Any]:
    resume_dir = inputs.get("resume_dir")
    if not os.path.isdir(resume_dir):
        return {**inputs, "resumes": []}

    allowlist = inputs.get("allowlist") or None
    allow_raw = set(allowlist or [])
    allow_norm = {_norm_filename(x) for x in allowlist} if allowlist else None

    resumes = []
    for filename in os.listdir(resume_dir):
        fullpath = os.path.join(resume_dir, filename)
        if not os.path.isfile(fullpath):
            continue
        if filename.startswith("."):
            continue

        base, ext = os.path.splitext(filename)
        if base.lower() in IGNORED_BASENAMES:
            continue

        ext = ext.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            continue

        # If allowlist present: process only those files
        if allowlist:
            fn_norm = _norm_filename(filename)
            if (filename not in allow_raw) and (fn_norm not in allow_norm):
                continue

        text = ""
        try:
            if ext == ".txt":
                with open(fullpath, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            elif ext == ".pdf":
                reader = PdfReader(fullpath)
                text = "\n".join(page.extract_text() or "" for page in reader.pages)
            elif ext == ".docx":
                doc = docx.Document(fullpath)
                text = "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue

        resumes.append({"file": filename, "text": text})

    print("load_resumes complete")
    return {**inputs, "resumes": resumes}

def extract_resume_fields(inputs: ScoringState) -> ScoringState:
    extracted_resumes = []

    for resume in inputs["resumes"]:
        prompt = (
            "Extract the following fields from the resume and return a STRICT JSON object with keys:\n"
            "Name (string), Skills (object or list), Education (list), Experience (list).\n\n"
            f"Resume:\n{resume['text']}\n"
        )

        # estimated_tokens = estimate_token(prompt)

        # print("Individual Resume Extraction: Estimated Tokens: ", estimated_tokens)

        start_time = time.time()
        response = client.chat.completions.create(
            model=os.getenv("DEPLOYMENT"),
            messages=[{"role": "user", "content": prompt}],
        )
        latency = time.time() - start_time
        # usage = response['usage']
        # prompt_tokens = response['prompt_tokens']
        # completion_tokens = response['completion_tokens']
        # total_tokens = prompt_tokens + completion_tokens


        print(f"""Individual Resume Scoring: (prompt) {response.usage.prompt_tokens} (completion) {response.usage.completion_tokens} (total) {response.usage.total_tokens}
                Latency: {latency} s""")



        raw = response.choices[0].message.content or "{}"
        raw_json = strip_to_json(raw)
        try:
            resume_data = json.loads(raw_json)
        except Exception:
            resume_data = {"Name": None, "Skills": None, "Education": None, "Experience": None}

        extracted_resumes.append({"file": resume["file"], "resume": resume_data})

    print("extract resume complete")
    return {**inputs, "resumes": extracted_resumes}

def llm_scorer(inputs: ScoringState) -> ScoringState:
    results = []
    jd_json = json.dumps(inputs["jd"], ensure_ascii=False)

    for res in inputs["resumes"]:
        candidate_json = json.dumps(res["resume"], ensure_ascii=False, indent=2)
        prompt = f"""
            Job Description:
            {jd_json}

            Candidate Resume:
            {candidate_json}

            Compare the resume and the JD semantically and score each field (Skills, Education, Experience) on a scale of 1-100.
            Compute an overall score using weights:
            - 70% Skills
            - 20% Experience
            - 10% Education

            Also provide a Reason for the scoring, distribute the reason into 3 category, Good, Okay and Miss. for each category
            use maximum of 8 words. Avoid Fillers focus on keywords for the reason.

            Return ONLY a JSON object exactly in this shape:
            {{
            "skills_score": 0,
            "education_score": 0,
            "experience_score": 0,
            "overall_score": 0,
            "reason": ""
            }}
            """
        
        # estimated_tokens = estimate_token(prompt)

        # print("Individual Resume Scorer: Estimated Tokens: ", estimated_tokens)

        start_time = time.time()
        response = client.chat.completions.create(
            model=os.getenv("DEPLOYMENT"),
            messages=[{"role":"user", "content": prompt}],
        )

        latency = time.time() - start_time
        # usage = response['usage']
        # prompt_tokens = response['prompt_tokens']
        # completion_tokens = response['completion_tokens']
        # total_tokens = prompt_tokens + completion_tokens


        print(f"""Individual Resume Scoring: (prompt) {response.usage.prompt_tokens} (completion) {response.usage.completion_tokens} (total) {response.usage.total_tokens}
                Latency: {latency} s""")


        raw = response.choices[0].message.content or "{}"
        raw_json = strip_to_json(raw)
        try:
            scores = json.loads(raw_json)
        except Exception:
            scores = {
                "skills_score": 0,
                "education_score": 0,
                "experience_score": 0,
                "overall_score": 0,
                "reason": "Model returned non-JSON; defaulting to zero scores."
            }

        for k in ["skills_score", "education_score", "experience_score", "overall_score"]:
            try:
                scores[k] = float(scores.get(k, 0))
            except Exception:
                scores[k] = 0.0

        results.append({"file": res["file"], "scores": scores})

    print("llm scoring complete")
    return {**inputs, "results": results}

# -----------------------------
# Build graph
# -----------------------------
graph = StateGraph(ScoringState)
graph.add_node("load_jd", load_jd)
graph.add_node("load_resumes", load_resumes)
graph.add_node("extract_resume_fields", extract_resume_fields)
graph.add_node("llm_scorer", llm_scorer)

graph.add_edge(START, "load_jd")
graph.add_edge("load_jd", "load_resumes")
graph.add_edge("load_resumes", "extract_resume_fields")
graph.add_edge("extract_resume_fields", "llm_scorer")
graph.add_edge("llm_scorer", END)

scoring_flow = graph.compile()

def run_scoring_flow(job_id: str, files: Optional[List[str]] = None, resume_dir: Optional[str] = None):
    """
    Public API for FastAPI:
    - If `files` is provided, only those filenames will be processed.
    - If `resume_dir` is provided, use it instead of BASE_RESUME_PATH + job_id.
    Returns: list of {"file": str, "scores": {...}}
    """
    inputs: ScoringState = {"job_id": job_id}
    if files:
        inputs["allowlist"] = files
    if resume_dir:
        inputs["resume_dir_override"] = resume_dir

    output = scoring_flow.invoke(inputs)
    return output["results"]