// import { useParams, useNavigate } from "react-router-dom";
// import { useEffect, useMemo, useState } from "react";

// export default function JobApplicationsPage() {
//   const { job_id } = useParams();
//   const navigate = useNavigate();

//   const [job, setJob] = useState(null);
//   const [applicants, setApplicants] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // New: button loading state
//   const [actionLoading, setActionLoading] = useState(null); // "score" | null

//   // New: sort state
//   const [sortKey, setSortKey] = useState("overall_score"); // "overall_score" | "skills_score" | "experience_score" | "education_score"
//   const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

//   const API = import.meta?.env?.VITE_API_BASE_URL ?? "http://localhost:8000";

//   useEffect(() => {
//     if (!job_id) return;

//     const ctl = new AbortController();

//     async function fetchData() {
//       try {
//         setLoading(true);
//         setError("");
//         const res = await fetch(`${API}/v1/jobs/${job_id}/applications`, {
//           signal: ctl.signal,
//           headers: { Accept: "application/json" },
//         });
//         if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
//         const data = await res.json();
//         setJob(data.job || null);
//         setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
//       } catch (err) {
//         if (err?.name === "AbortError") return;
//         console.error("Error fetching job applications:", err);
//         setError("Unable to load job details. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchData();
//     return () => ctl.abort();
//   }, [job_id, API]);

//   // --- New: scoring trigger (sync) ---
//   async function handleScore() {
//     if (!job_id) return;
//     try {
//       setActionLoading("score");
//       setError("");
//       const res = await fetch(`${API}/v1/jobs/${job_id}/score`, {
//         method: "POST",
//         headers: { Accept: "application/json" },
//       });
//       if (!res.ok) throw new Error(`Score failed: ${res.status}`);
//       const data = await res.json();
//       setJob(data.job || null);
//       setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
//     } catch (e) {
//       console.error(e);
//       setError("Scoring failed. Please try again.");
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   // --- Value helpers ---
//   // Safely read a numeric value; prefer detailed scores, fallback to legacy `score` for overall.
//   function readMetric(app, key) {
//     const s = app?.scores || {};
//     switch (key) {
//       case "overall_score":
//         return numOrNull(s.overall_score ?? app?.score);
//       case "skills_score":
//         return numOrNull(s.skills_score);
//       case "experience_score":
//         return numOrNull(s.experience_score);
//       case "education_score":
//         return numOrNull(s.education_score);
//       default:
//         return null;
//     }
//   }
//   function numOrNull(v) {
//     const n = Number(v);
//     return Number.isFinite(n) ? n : null;
//   }

//   function onUpdate(job, e) {
//   e.stopPropagation();
//   if (!job?.id) return;
//   navigate(`/v1/jobs/${job.id}/update`);
//   }

//   // --- Sorted list (NA last) ---
//   const sortedApplicants = useMemo(() => {
//     const arr = [...(applicants || [])];
//     arr.sort((a, b) => {
//       const va = readMetric(a, sortKey);
//       const vb = readMetric(b, sortKey);
//       // NA always last
//       if (va == null && vb == null) return 0;
//       if (va == null) return 1;
//       if (vb == null) return -1;
//       return sortDir === "desc" ? vb - va : va - vb;
//     });
//     return arr;
//   }, [applicants, sortKey, sortDir]);

//   {/* Loading state */}
// if (loading){
//   return (
//   <div className="min-h-screen bg-slate-950 text-slate-200">
//     <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//         <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
//           Virtual TA <span className="text-indigo-400">Jobs</span>
//         </h1>
//         <p className="mt-1 text-sm text-slate-400">Loading job applications…</p>
//       </div>
//     </div>

//     <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
//       <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden">
//         <div className="p-6 text-slate-400">Loading job details…</div>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-slate-800">
//             <thead className="bg-slate-900/60">
//               <tr>
//                 <Th>Applicant</Th>
//                 <Th>Resume</Th>
//                 <Th>Score</Th>
//                 <Th className="text-right pr-4">Actions</Th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-800">
//               <SkeletonRows rows={6} />
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="mt-6 text-center text-sm text-slate-400">
//         <a className="hover:underline">Need Help, Contact Admin</a>
//       </div>
//     </div>
//   </div>
// );
// }

// if (error) { 
//   return (
//   <div className="min-h-screen bg-slate-950 text-slate-200">
//     <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//         <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
//           Virtual TA <span className="text-indigo-400">Jobs</span>
//         </h1>
//         <p className="mt-1 text-sm text-slate-400">Something went wrong</p>
//       </div>
//     </div>

//     <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
//       <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm">
//         <div className="p-6 text-sm text-rose-300 bg-rose-900/10 border-b border-slate-800">
//           {error}
//         </div>
//       </div>
//     </div>
//   </div>
// );
// }

// if (!job){ return (
//   <div className="min-h-screen bg-slate-950 text-slate-200">
//     <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//         <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
//           Virtual TA <span className="text-indigo-400">Jobs</span>
//         </h1>
//         <p className="mt-1 text-sm text-slate-400">Applications</p>
//       </div>
//     </div>

//     <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
//       <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm">
//         <div className="p-6 text-sm text-rose-300 bg-rose-900/10 border-b border-slate-800">
//           Job not found
//         </div>
//       </div>
//     </div>
//   </div>
// );
// }

// if (job) { return (
//   <div className="fixed inset-0 overflow-auto">
//     {/* Header / Hero */}
//     <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//       <div className="mx-20 max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//         <div className="mb-2 flex items-center justify-between">
//           <div className="flex items-center gap-5">
//             <div className="text-left sm:text-5xl sm:text-left font-bold text-slate-100">
//               Virtual TA <span className="text-indigo-400">Jobs</span>
//             </div>
//             <span className="hidden sm:inline-block text-sm text-slate-400">
//               Applications for {job.title || "Job"}
//             </span>
//           </div>

//           <div className="flex flex-wrap items-center justify-right gap-3">
//             {/* Sort controls */}
//             <div className="flex items-center gap-2">
//               <label className="text-sm text-slate-300">Sort by</label>
//               <select
//                 className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                 value={sortKey}
//                 onChange={(e) => setSortKey(e.target.value)}
//               >
//                 <option value="overall_score">Overall</option>
//                 <option value="skills_score">Skills</option>
//                 <option value="experience_score">Experience</option>
//                 <option value="education_score">Education</option>
//               </select>

//               <button
//                 type="button"
//                 onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
//                 className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                 title={`Sort ${sortDir === "desc" ? "descending" : "ascending"}`}
//               >
//                 {sortDir === "desc" ? "↓" : "↑"}
//               </button>

//               <span className="ml-1 inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
//                 {({ overall_score: "Overall", skills_score: "Skills", experience_score: "Experience", education_score: "Education" }[sortKey]) || "Overall"}
//               </span>
//             </div>

//             {/* Score button */}
//             <button
//               type="button"
//               className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//               onClick={handleScore}
//               disabled={actionLoading !== null}
//             >
//               {actionLoading === "score" ? "Scoring…" : "Score"}
//             </button>

            
//             <button
//               type="button"
//               className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
//               title="Reranking is FE-only (use sort control)"
//               onClick={(e) => onUpdate(job, e)}
//             >
//               Update Job
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>

//     {/* Content */}
//     <div className="mx-20 max-w px-4 sm:px-6 lg:px-8 py-8">
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
//         {/* Applicants Table */}
//         <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-slate-800">
//               <thead className="bg-slate-900/60 sticky top-0 z-10 txt-5xl">
//                 <tr>
//                   <Th>Applicant</Th>
//                   <Th>Resume</Th>
//                   <Th>
//                     Score
//                     <span className="ml-2 rounded-full border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
//                       {({ overall_score: "Overall", skills_score: "Skills", experience_score: "Experience", education_score: "Education" }[sortKey]) || "Overall"}
//                     </span>
//                   </Th>
//                   <Th>Reasoning</Th>
//                   <Th className="text-center pr-4">Actions</Th>
//                   <Th className="text-center pr-4">Details</Th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-800">
//                 {sortedApplicants && sortedApplicants.length > 0 ? (
//                   sortedApplicants.map((a, idx) => {
//                     const applicantId =
//                       a?.id || a?.email || a?.resume_url || a?.filename;

//                     return (
//                       <tr
//                         key={`${a.filename || a.id || a.email || a.resume_url || a.name || idx}`}
//                         className="hover:bg-slate-800/40 transition-colors"
//                       >
//                         <Td className="max-w-[32ch] truncate">
//                           {a.name || a.full_name || "Unnamed"}
//                         </Td>

//                         <Td>
//                           {a.resume_url ? (
//                             <a
//                               href={a.resume_url}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-indigo-300 hover:text-indigo-200 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
//                             >
//                               View Resume
//                             </a>
//                           ) : (
//                             <span className="text-slate-500">—</span>
//                           )}
//                         </Td>

//                         <Td className="text-center">
//                           <ScoreBadge score={readMetric(a, sortKey)} />
//                         </Td>

//                         <Td>
//                           {a?.scores?.reason ? (
//                             <div className="mt-1 text-sm text-slate-400">
//                               {a.scores.reason}
//                             </div>
//                           ) : null}
//                         </Td>

//                         <Td className="text-right pr-4">
//                           <button
//                             type="button"
//                             className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               // Redirect to /v1/jobs/{job_id}/{applicant_id}
//                               const raw =
//                                 a.id ||
//                                 a.filename ||
//                                 a.name ||
//                                 a.full_name ||
//                                 a.email ||
//                                 "applicant";
//                               // Strip extension + slugify
//                               const withoutExt = String(raw).replace(/\.[^/.]+$/, "");
//                               const slug = withoutExt
//                                 .trim()
//                                 .toLowerCase()
//                                 .replace(/\s+/g, "-")
//                                 .replace(/[^a-z0-9-_]/g, "");
//                               navigate(`/v1/jobs/${job_id}/${slug}/sch_interview`);
//                             }}
//                           >
//                             Schedule Interview
//                           </button>
//                         </Td>
//                         <Td>
//                           <button 
//                           className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                           onClick={(e) => {
//                               e.stopPropagation();
//                               // Redirect to /v1/jobs/{job_id}/{applicant_id}
//                               const raw =
//                                 a.id ||
//                                 a.filename ||
//                                 a.name ||
//                                 a.full_name ||
//                                 a.email ||
//                                 "applicant";
//                               // Strip extension + slugify
//                               const withoutExt = String(raw).replace(/\.[^/.]+$/, "");
//                               const slug = withoutExt
//                                 .trim()
//                                 .toLowerCase()
//                                 .replace(/\s+/g, "-")
//                                 .replace(/[^a-z0-9-_]/g, "");
//                               navigate(`/v1/insights/${job_id}/${slug}`);
//                             }}
//                           >
//                             AI Insights</button>
//                         </Td>
//                       </tr>
//                     );
//                   })
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={5}
//                       className="px-4 py-6 text-sm text-slate-400 text-center"
//                     >
//                       No applicants found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-sm">
//             <div className="text-slate-400">
//               {applicants?.length || 0} applicant{(applicants?.length || 0) === 1 ? "" : "s"}
//             </div>
//           </div>
//         </div>

//         {/* Job Details Card */}
//         <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm p-6">
//           <h1 className="text-2xl font-semibold text-slate-100">{job.title}</h1>
//           <div className="mt-2">
//             <StatusBadge status={job.status} />
//           </div>

//           <div className="mt-6 space-y-3 text-sm">
//             <DetailRow label="Requirement ID" value={job.requirement_id} />
//             <DetailRow label="Slots" value={job.slots} />
//             <DetailRow label="Opening Date" value={job.opening_date} />
//             <DetailRow label="Closing Date" value={job.closing_date} />
//             <DetailRow label="Location" value={job.location} />
//             <DetailRow label="Work Mode" value={job.workmode} />
//           </div>

//           <div className="mt-6">
//             <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
//               Description
//             </h2>
//             {/* Scrollable JD section (preserves whitespace) */}
//             <div
//               className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 whitespace-pre-line
//                          scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40"
//               role="region"
//               aria-label="Job Description"
//             >
//               {job.jd || "—"}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Help link */}
//       <div className="mt-6 text-center text-sm text-slate-400">
//         <a className="hover:underline">Need Help, Contact Admin</a>
//       </div>
//     </div>
//   </div>
// ); }

// }

// /* ---------- helpers (UI-only) ---------- */
// function Th({ children, className = "" }) {
//   return (
//     <th
//       className={`px-4 py-3 text-left text-base font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 ${className}`}
//     >
//       {children}
//     </th>
//   );
// }
// function Td({ children, className = "" }) {
//   return <td className={`px-4 py-3 text-sm text-slate-800 dark:text-slate-100 ${className}`}>{children}</td>;
// }

// function StatusBadge({ status }) {
//   const s = String(status || "open").toLowerCase();
//   const cls =
//     s === "closed"
//       ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
//       : s === "on-hold" || s === "onhold"
//       ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
//       : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
//   return (
//     <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
//       {s.replace("_", " ")}
//     </span>
//   );
// }

// function SkeletonRows({ rows = 6 }) {
//   return (
//     <>
//       {Array.from({ length: rows }).map((_, i) => (
//         <tr key={i} className="animate-pulse">
//           {Array.from({ length: 4 }).map((__, j) => (
//             <td key={j} className="px-4 py-3">
//               <div className="h-4 w-[80%] rounded bg-slate-200 dark:bg-slate-700" />
//             </td>
//           ))}
//         </tr>
//       ))}
//     </>
//   );
// }

// function DetailRow({ label, value }) {
//   return (
//     <div className="flex items-start justify-between gap-4">
//       <div className="text-slate-600 dark:text-slate-300">{label}</div>
//       <div className="text-slate-800 dark:text-slate-100 text-right">{value ?? "—"}</div>
//     </div>
//   );
// }

// // New: badge that prints a colored score or NA
// function ScoreBadge({ score }) {
//   if (score == null || Number.isNaN(Number(score))) {
//     return <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">NA</span>;
//   }
//   const s = Number(score);
//   const cls =
//     s >= 70
//       ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
//       : s >= 45
//       ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
//       : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
//   return <span className={`inline-flex align-center items-center rounded-full px-3 py-2 text-m font-medium ${cls}`}>{s.toFixed(0)}</span>;
// }


import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

export default function JobApplicationsPage() {
  const { job_id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action button loading
  const [actionLoading, setActionLoading] = useState(null); // "score" | null

  // Sort state
  const [sortKey, setSortKey] = useState("overall_score"); // "overall_score" | "skills_score" | "experience_score" | "education_score"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    next: null,
    prev: null,
    self: null,
  });

  const API = import.meta?.env?.VITE_API_BASE_URL ?? "http://localhost:8000";

  useEffect(() => {
    if (!job_id) return;
    const ctl = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const url = `${API}/v1/jobs/${job_id}/applications?page=${page}&page_size=${pageSize}`;
        const res = await fetch(url, {
          signal: ctl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();

        setJob(data.job ?? null);
        setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
        setPagination(
          data.pagination ?? {
            total: 0,
            page: 1,
            page_size: pageSize,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next: null,
            prev: null,
            self: null,
          }
        );
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Error fetching job applications:", err);
        setError("Unable to load job details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => ctl.abort();
  }, [job_id, API, page, pageSize]);

  // --- Scoring trigger (sync) ---
  async function handleScore() {
    if (!job_id) return;
    try {
      setActionLoading("score");
      setError("");
      const res = await fetch(`${API}/v1/jobs/${job_id}/score`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Score failed: ${res.status}`);
      const data = await res.json();
      setJob(data.job ?? null);
      setApplicants(Array.isArray(data.applicants) ? data.applicants : []);
      // After a scoring run, reset to first page to reflect new scores consistently
      setPage(1);
    } catch (e) {
      console.error(e);
      setError("Scoring failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  // --- Value helpers ---
  // Safely read a numeric value; prefer detailed scores, fallback to legacy `score` for overall.
  function readMetric(app, key) {
    const s = app?.scores ?? {};
    switch (key) {
      case "overall_score":
        return numOrNull(s.overall_score ?? app?.score);
      case "skills_score":
        return numOrNull(s.skills_score);
      case "experience_score":
        return numOrNull(s.experience_score);
      case "education_score":
        return numOrNull(s.education_score);
      default:
        return null;
    }
  }
  function numOrNull(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function onUpdate(job, e) {
    e.stopPropagation();
    if (!job?.id) return;
    navigate(`/v1/jobs/${job.id}/update`);
  }

  // --- Sorted list (NA last) ---
  const sortedApplicants = useMemo(() => {
    const arr = [...(applicants ?? [])];
    arr.sort((a, b) => {
      const va = readMetric(a, sortKey);
      const vb = readMetric(b, sortKey);
      // NA always last
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return arr;
  }, [applicants, sortKey, sortDir]);

  // --- Renders ---

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Virtual TA <span className="text-indigo-400">Jobs</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Loading job applications…</p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden">
            <div className="p-6 text-slate-400">Loading job details…</div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/60">
                  <tr>
                    <Th>Applicant</Th>
                    <Th>Resume</Th>
                    <Th>Score</Th>
                    <Th className="text-right pr-4">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <SkeletonRows rows={6} />
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-slate-400">
            <a className="hover:underline">Need Help, Contact Admin</a>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Virtual TA <span className="text-indigo-400">Jobs</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Something went wrong</p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm">
            <div className="p-6 text-sm text-rose-300 bg-rose-900/10 border-b border-slate-800">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Virtual TA <span className="text-indigo-400">Jobs</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Applications</p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm">
            <div className="p-6 text-sm text-rose-300 bg-rose-900/10 border-b border-slate-800">Job not found</div>
          </div>
        </div>
      </div>
    );
  }

  // Main
  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Header / Hero */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
        <div className="mx-20 max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="text-left sm:text-5xl sm:text-left font-bold text-slate-100">
                Virtual TA <span className="text-indigo-400">Jobs</span>
              </div>
              <span className="hidden sm:inline-block text-sm text-slate-400">
                Applications for {job.title ?? "Job"} • {pagination.total} total
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-right gap-3">
              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300">Sort by</label>
                <select
                  className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                >
                  <option value="overall_score">Overall</option>
                  <option value="skills_score">Skills</option>
                  <option value="experience_score">Experience</option>
                  <option value="education_score">Education</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  title={`Sort ${sortDir === "desc" ? "descending" : "ascending"}`}
                >
                  {sortDir === "desc" ? "↓" : "↑"}
                </button>
                <span className="ml-1 inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                  {({ overall_score: "Overall", skills_score: "Skills", experience_score: "Experience", education_score: "Education" }[sortKey]) ?? "Overall"}
                </span>
              </div>

              {/* Score button */}
              <button
                type="button"
                className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                onClick={handleScore}
                disabled={actionLoading !== null}
              >
                {actionLoading === "score" ? "Scoring…" : "Score"}
              </button>

              <button
                type="button"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="Reranking is FE-only (use sort control)"
                onClick={(e) => onUpdate(job, e)}
              >
                Update Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-20 max-w px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Applicants Table */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/60 sticky top-0 z-10 txt-5xl">
                  <tr>
                    <Th>Applicant</Th>
                    <Th>Resume</Th>
                    <Th>
                      Score
                      <span className="ml-2 rounded-full border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                        {({ overall_score: "Overall", skills_score: "Skills", experience_score: "Experience", education_score: "Education" }[sortKey]) ?? "Overall"}
                      </span>
                    </Th>
                    <Th>Reasoning</Th>
                    <Th className="text-center pr-4">Actions</Th>
                    <Th className="text-center pr-4">Details</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedApplicants && sortedApplicants.length > 0 ? (
                    sortedApplicants.map((a, idx) => {
                      const applicantId = a?.id ?? a?.email ?? a?.resume_url ?? a?.filename;
                      return (
                        <tr
                          key={`${a.filename ?? a.id ?? a.email ?? a.resume_url ?? a.name ?? idx}`}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <Td className="max-w-[32ch] truncate">{a.name ?? a.full_name ?? "Unnamed"}</Td>
                          <Td>
                            {a.resume_url ? (
                              <a
                                href={a.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-300 hover:text-indigo-200 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                              >
                                View Resume
                              </a>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </Td>
                          <Td className="text-center">
                            <ScoreBadge score={readMetric(a, sortKey)} />
                          </Td>
                          <Td>
                            {a?.scores?.reason ? (
                              <div className="mt-1 text-sm text-slate-400">{a.scores.reason}</div>
                            ) : null}
                          </Td>
                          <Td className="text-right pr-4">
                            <button
                              type="button"
                              className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Redirect to /v1/jobs/{job_id}/{applicant_id}
                                const raw =
                                  a.id ??
                                  a.filename ??
                                  a.name ??
                                  a.full_name ??
                                  a.email ??
                                  "applicant";
                                // Strip extension + slugify
                                const withoutExt = String(raw).replace(/\.[^/.]+$/, "");
                                const slug = withoutExt
                                  .trim()
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")
                                  .replace(/[^a-z0-9\-\_]/g, "");
                                navigate(`/v1/jobs/${job_id}/${slug}/sch_interview`);
                              }}
                            >
                              Schedule Interview
                            </button>
                          </Td>
                          <Td>
                            <button
                              className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Redirect to /v1/insights/{job_id}/{applicant_id}
                                const raw =
                                  a.id ??
                                  a.filename ??
                                  a.name ??
                                  a.full_name ??
                                  a.email ??
                                  "applicant";
                                const withoutExt = String(raw).replace(/\.[^/.]+$/, "");
                                const slug = withoutExt
                                  .trim()
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")
                                  .replace(/[^a-z0-9\-\_]/g, "");
                                navigate(`/v1/insights/${job_id}/${slug}`);
                              }}
                            >
                              AI Insights
                            </button>
                          </Td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-slate-400 text-center">
                        No applicants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-sm">
              {/* Left: range summary */}
              <div className="text-slate-400">
                {(() => {
                  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
                  const end = Math.min(pagination.page * pagination.page_size, pagination.total);
                  return (
                    <span>
                      Showing <span className="text-slate-200">{start}</span>–<span className="text-slate-200">{end}</span> of{" "}
                      <span className="text-slate-2 00">{pagination.total}</span> applicants
                    </span>
                  );
                })()}
              </div>

              {/* Middle: page size selector */}
              <div className="flex items-center gap-2 text-slate-300">
                <span className="hidden sm:inline">Rows per page</span>
                <select
                  className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value) || 10;
                    setPageSize(newSize);
                    setPage(1); // reset to first page when size changes
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right: pager */}
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                  className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  onClick={() => setPage(1)}
                  disabled={!pagination.has_prev}
                  title="First page"
                >
                  «
                </button>
                <button
                  className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.has_prev}
                  title="Previous page"
                >
                  ‹ Prev
                </button>

                {/* Numbered pages (window) */}
                {(() => {
                  const pages = [];
                  const total = pagination.total_pages || 1;
                  const current = pagination.page || 1;
                  const windowSize = 5; // up to 5 buttons
                  let start = Math.max(1, current - Math.floor(windowSize / 2));
                  let end = Math.min(total, start + windowSize - 1);
                  if (end - start + 1 < windowSize) {
                    start = Math.max(1, end - windowSize + 1);
                  }

                  // leading
                  if (start > 1) {
                    pages.push(
                      <button
                        key={1}
                        className={`px-3 py-1 rounded-md border border-slate-700 ${
                          current === 1 ? "bg-indigo-600 text-white" : "bg-slate-900/60 text-slate-200 hover:bg-slate-800"
                        }`}
                        onClick={() => setPage(1)}
                      >
                        1
                      </button>
                    );
                    if (start > 2) pages.push(<span key="start-ellipsis" className="px-1 text-slate-500">…</span>);
                  }
                  // window
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        className={`px-3 py-1 rounded-md border border-slate-700 ${
                          current === i ? "bg-indigo-600 text-white" : "bg-slate-900/60 text-slate-200 hover:bg-slate-800"
                        }`}
                        onClick={() => setPage(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                  // trailing
                  if (end < total) {
                    if (end < total - 1) pages.push(<span key="end-ellipsis" className="px-1 text-slate-500">…</span>);
                    pages.push(
                      <button
                        key={total}
                        className={`px-3 py-1 rounded-md border border-slate-700 ${
                          current === total ? "bg-indigo-600 text-white" : "bg-slate-900/60 text-slate-200 hover:bg-slate-800"
                        }`}
                        onClick={() => setPage(total)}
                      >
                        {total}
                      </button>
                    );
                  }
                  return pages;
                })()}

                <button
                  className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(pagination.total_pages || 1, p + 1))}
                  disabled={!pagination.has_next}
                  title="Next page"
                >
                  Next ›
                </button>
                <button
                  className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  onClick={() => setPage(pagination.total_pages || 1)}
                  disabled={!pagination.has_next}
                  title="Last page"
                >
                  »
                </button>
              </nav>
            </div>
          </div>

          {/* Job Details Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-slate-100">{job.title}</h1>
            <div className="mt-2">
              <StatusBadge status={job.status} />
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <DetailRow label="Requirement ID" value={job.requirement_id} />
              <DetailRow label="Slots" value={job.slots} />
              <DetailRow label="Opening Date" value={job.opening_date} />
              <DetailRow label="Closing Date" value={job.closing_date} />
              <DetailRow label="Location" value={job.location} />
              <DetailRow label="Work Mode" value={job.workmode} />
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Description</h2>
              {/* Scrollable JD section (preserves whitespace) */}
              <div
                className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 whitespace-pre-line 
                scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40"
                role="region"
                aria-label="Job Description"
              >
                {job.jd ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Help link */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <a className="hover:underline">Need Help, Contact Admin</a>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers (UI-only) ---------- */
function Th({ children, className = "" }) {
  return (
    <th className={`px-2 py-2 text-center text-base font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-2 py-2 text-sm text-slate-800 dark:text-slate-100 p-4 ${className}`}>{children}</td>;
}
function StatusBadge({ status }) {
  const s = String(status ?? "open").toLowerCase();
  const cls =
    s === "closed"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      : s === "on-hold" || s === "onhold"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{s.replace("_", " ")}</span>;
}
function SkeletonRows({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 4 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-[80%] rounded bg-slate-200 dark:bg-slate-700" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-slate-600 dark:text-slate-300">{label}</div>
      <div className="text-slate-800 dark:text-slate-100 text-right">{value ?? "—"}</div>
    </div>
  );
}
// Badge that prints a colored score or NA
function ScoreBadge({ score }) {
  if (score == null || Number.isNaN(Number(score))) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        NA
      </span>
    );
  }
  const s = Number(score);
  const cls =
    s >= 70
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : s >= 45
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return <span className={`inline-flex align-center items-center rounded-full px-3 py-2 text-m font-medium ${cls}`}>{s.toFixed(0)}</span>;
}
