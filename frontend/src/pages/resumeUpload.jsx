import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * UploadResumes.jsx
 * Dark/gradient UI aligned to your "Virtual TA" theme.
 *
 * Route (React Router v6):
 *   <Route path="/v1/jobs/:job_id/upload" element={<UploadResumes />} />
 */

const MAX_FILE_MB = 8;
const ACCEPTED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Prefer env; fallback to your local API for dev
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function UploadResumes(props) {
  const { job_id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null); // { requirement_id, title, status, ... }
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState([]); // {id,file,status,progress,error,xhr}
  const [isUploading, setIsUploading] = useState(false);
  const [concurrency, setConcurrency] = useState(3);

  // --- Load job details (for requirement_id and header info) ---
  useEffect(() => {
    if (!job_id) return;
    const controller = new AbortController();
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}`, {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        // attempt safe JSON parse
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            (data && (data.message || data.error)) ||
              `Failed to load job ${job_id} (${res.status})`
          );
        }
        if (!ignore) setJob(data);
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error("Job fetch error:", e);
        if (!ignore) setJob(null);
      }
    }

    load();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [job_id]);

  const validateFile = (file) => {
    const sizeOk = file.size <= MAX_FILE_MB * 1024 * 1024;
    const typeOk =
      ACCEPTED_MIME.includes(file.type) || /\.(pdf|docx?|rtf)$/i.test(file.name);
    if (!sizeOk) return `File too large (>${MAX_FILE_MB} MB)`;
    if (!typeOk) return "Only PDF/DOC/DOCX files are allowed";
    return null;
  };

  const addFiles = (files) => {
    const fresh = [];
    for (const file of files) {
      const err = validateFile(file);
      fresh.push({
        id: crypto.randomUUID(),
        file,
        status: err ? "error" : "queued",
        progress: err ? 0 : 0,
        error: err || undefined,
        xhr: undefined,
      });
    }
    setRows((prev) => [...prev, ...fresh]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) addFiles(files);
  };

  const onBrowse = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files);
    e.target.value = "";
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const cancelRow = (id) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id && r.xhr && r.status === "uploading") {
          r.xhr.abort();
          return { ...r, status: "canceled", progress: 0, xhr: undefined };
        }
        return r;
      })
    );
  };

  const resetFinished = () => {
    setRows((prev) => prev.filter((r) => r.status !== "success"));
  };

  const uploadSingle = (row, jid) =>
    new Promise((resolve) => {
      const form = new FormData();
      form.append("resume", row.file);

      // IMPORTANT: backend expects 'requirementId' (or will resolve from DB)
      if (job?.requirement_id) {
        form.append("requirementId", job.requirement_id);
      }

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `${API_BASE}/v1/jobs/${encodeURIComponent(jid)}/resumes`,
        true
      );
      // If your FastAPI requires cookies across domains:
      // xhr.withCredentials = true;
      // Don't set Content-Type; the browser will set multipart boundary.

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const p = Math.round((e.loaded / e.total) * 100);
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, progress: p } : r))
        );
      };

      xhr.onloadstart = () => {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: "uploading", xhr } : r
          )
        );
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id
                  ? { ...r, status: "success", progress: 100, xhr: undefined }
                  : r
              )
            );
          } else if (xhr.status === 0) {
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id
                  ? { ...r, status: "canceled", xhr: undefined }
                  : r
              )
            );
          } else {
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id
                  ? {
                      ...r,
                      status: "error",
                      error: xhr.responseText || "Upload failed",
                      xhr: undefined,
                    }
                  : r
              )
            );
          }
          resolve();
        }
      };

      xhr.onerror = () => {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  status: "error",
                  error: "Network error",
                  xhr: undefined,
                }
              : r
          )
        );
        resolve();
      };

      xhr.send(form);
    });

  const startUpload = async () => {
    if (!job_id) return;
    // Block if requirement_id missing (prevents backend errors)
    if (!job?.requirement_id) {
      alert("Requirement ID not available for this job. Please retry after job loads.");
      return;
    }

    setIsUploading(true);

    const queue = rows.filter((r) => r.status === "queued");
    let index = 0;

    const run = async () => {
      while (index < queue.length) {
        const current = queue[index++];
        const err = validateFile(current.file);
        if (err) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === current.id ? { ...r, status: "error", error: err } : r
            )
          );
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        await uploadSingle(current, job_id);
      }
    };

    const workers = [];
    const pool = Math.max(1, Math.min(5, concurrency));
    for (let i = 0; i < pool; i += 1) workers.push(run());
    await Promise.all(workers);

    setIsUploading(false);
  };

  const queued = rows.filter((r) => r.status === "queued").length;
  const uploading = rows.filter((r) => r.status === "uploading").length;
  const succeeded = rows.filter((r) => r.status === "success").length;
  const failed = rows.filter((r) => r.status === "error").length;

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Header / Hero (Insights-style gradient) */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Virtual TA <span className="text-indigo-400">Upload Resumes</span>
            </h1>
            <p className="text-sm text-slate-400">
              Attach candidate resumes against the selected requirement.
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Job summary card */}
        <div className="mx-auto w-full rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Requirement ID</div>
              <div className="font-mono text-slate-100">
                {job?.requirement_id || job_id || "—"}
              </div>
            </div>
            <div className="min-w-[200px]">
              <div className="text-xs text-slate-400">Title</div>
              <div className="text-slate-100">{job?.title}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Status</div>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  (job?.status || "open") === "open"
                    ? "border-emerald-400 text-emerald-300"
                    : "border-slate-600 text-slate-300"
                }`}
              >
                {job?.status || "open"}
              </span>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-6 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-slate-800 bg-slate-900/40"
            }`}
          >
            <div className="text-slate-100 text-lg font-medium">
              Drag &amp; drop resumes here
            </div>
            <div className="mt-1 text-sm text-slate-400">
              or click to browse (PDF, DOC, DOCX • up to {MAX_FILE_MB} MB each)
            </div>

            <label className="mt-5 inline-flex">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={onBrowse}
                // name="resume" // not required since we build FormData manually
              />
              <span className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 cursor-pointer">
                Browse files
              </span>
            </label>
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {rows.length} selected • {queued} queued • {uploading} uploading •{" "}
              {succeeded} success • {failed} failed
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400">Concurrency</label>
              <select
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <button
                onClick={startUpload}
                disabled={
                  isUploading || queued === 0 || !job_id || !job?.requirement_id
                }
                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-400
                ${
                  isUploading || queued === 0 || !job_id || !job?.requirement_id
                    ? "cursor-not-allowed bg-indigo-500/60"
                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                }`}
              >
                {isUploading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Uploading…
                  </span>
                ) : (
                  "Start Upload"
                )}
              </button>

              <button
                type="button"
                onClick={resetFinished}
                className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold bg-slate-900/60 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                Clear uploaded
              </button>

              <button
                type="button"
                onClick={() => navigate("/v1/jobs")}
                className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold bg-slate-900/60 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                Back
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="text-left font-medium px-4 py-3">File</th>
                  <th className="text-left font-medium px-4 py-3">Size</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Progress</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No files added yet.
                    </td>
                  </tr>
                )}

                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">
                        {r.file.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.file.type || "Unknown type"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatBytes(r.file.size)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium
                          ${
                            r.status === "success"
                              ? "border-emerald-400 text-emerald-300"
                              : r.status === "error"
                              ? "border-rose-400 text-rose-300"
                              : r.status === "uploading"
                              ? "border-indigo-400 text-indigo-300"
                              : r.status === "canceled"
                              ? "border-amber-400 text-amber-300"
                              : "border-slate-700 text-slate-300"
                          }`}
                      >
                        {r.status}
                      </span>
                      {r.error && (
                        <div className="text-xs text-rose-300 mt-1">
                          {r.error}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 w-[260px]">
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            r.status === "error"
                              ? "bg-rose-500"
                              : "bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                          }`}
                          style={{ width: `${r.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "uploading" ? (
                        <button
                          onClick={() => cancelRow(r.id)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold bg-slate-900/60 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => removeRow(r.id)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold bg-slate-900/60 text-rose-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer hint */}
          <p className="mt-4 text-xs text-slate-500">
            Tip: You can add more files while uploads are in progress. Duplicates
            should be handled server-side (e.g., checksum/filename rules).
          </p>
        </div>

        <div className="h-10" />
      </div>

      {/* FULL-SCREEN LOADING OVERLAY */}
      {isUploading && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="status"
          aria-live="assertive"
          aria-label="Uploading resumes, please wait"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-white text-sm">Uploading resumes…</p>
          </div>
        </div>
      )}
    </div>
  );
}
