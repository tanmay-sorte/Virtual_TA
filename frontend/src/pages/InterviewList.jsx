// import React, { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";

// const API_BASE = "http://localhost:8000";
// const API = {
//   listInterviews: (params) => {
//     const qs = new URLSearchParams(params);
//     return `${API_BASE}/v1/interviews?${qs.toString()}`;
//   },
//   icsDownload: (id) => `${API_BASE}/v1/interviews/${encodeURIComponent(id)}/ics`,
//   getJob: (job_id) => `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}`,
// };

// // Safe JSON
// async function safeJson(res) {
//   const text = await res.text();
//   const ct = res.headers.get("content-type") || "";
//   const looksJson =
//     ct.includes("application/json") ||
//     (/^\s*[\[{]/.test(text) && /[\]}]\s*$/.test(text));
//   if (looksJson) {
//     try {
//       return JSON.parse(text);
//     } catch {}
//   }
//   throw new Error(`Expected JSON (${ct}), got: ${text.slice(0, 200)}`);
// }

// // UTC -> Local
// function utcToLocal(dtIso, options) {
//   try {
//     const d = new Date(dtIso);
//     return new Intl.DateTimeFormat(undefined, {
//       dateStyle: "medium",
//       timeStyle: "short",
//       ...options,
//     }).format(d);
//   } catch {
//     return dtIso;
//   }
// }

// export default function InterviewsListPage() {
//   const navigate = useNavigate();

//   const [items, setItems] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [skip, setSkip] = useState(0);
//   const [limit, setLimit] = useState(20);

//   const [jobId, setJobId] = useState("");
//   const [applicantId, setApplicantId] = useState("");
//   const [mode, setMode] = useState("");
//   const [upcoming, setUpcoming] = useState(true); // default: upcoming

//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState(null);

//   // Cache job titles
//   const [jobMetaMap, setJobMetaMap] = useState({});
//   const [loadingTitles, setLoadingTitles] = useState(false);

//   const params = useMemo(() => {
//     const p = { limit, skip };
//     if (jobId.trim()) p.job_id = jobId.trim();
//     if (applicantId.trim()) p.applicant_id = applicantId.trim();
//     if (mode) p.mode = mode;
//     if (upcoming) p.upcoming = "true";
//     return p;
//   }, [limit, skip, jobId, applicantId, mode, upcoming]);

//   // Load interviews
//   useEffect(() => {
//     let cancelled = false;
//     async function load() {
//       try {
//         setLoading(true);
//         setErr(null);
//         const res = await fetch(API.listInterviews(params), {
//           headers: { Accept: "application/json" },
//         });
//         if (!res.ok) throw new Error(`Failed (${res.status})`);
//         const data = await safeJson(res);
//         if (!cancelled) {
//           setItems(Array.isArray(data.items) ? data.items : []);
//           setTotal(data.total ?? 0);
//         }
//       } catch (e) {
//         if (!cancelled) setErr(e.message || "Failed to load");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }
//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, [params]);

//   // Fetch missing job titles (batched)
//   useEffect(() => {
//     let cancelled = false;
//     async function fetchMissingTitles() {
//       // const uniqueIds = Array.from(
//       //   new Set((items || []).map((it) => it.job_id).filter(Boolean))
//       // );
//       // const missing = uniqueIds.filter((id) => !(id in jobTitleMap));

      
//       const uniqueIds = Array.from(
//         new Set((items ?? []).map((it) => it.job_id).filter(Boolean))
//       );
//       const missing = uniqueIds.filter((id) => !(id in jobMetaMap));


//       if (missing.length === 0) return;

//       setLoadingTitles(true);
//       try {
        
// const results = await Promise.all(
//   missing.map(async (id) => {
//     try {
//       const res = await fetch(API.getJob(id), { headers: { Accept: "application/json" } });
//       if (!res.ok) throw new Error();
//       const job = await safeJson(res);
//       return {
//         id,
//         title: job?.title ?? "",
//         // handle both snake_case and camelCase from the API, just in case
//         requirement_id: job?.requirement_id ?? job?.requirementId ?? ""
//       };
//     } catch {
//       return { id, title: "", requirement_id: "" };
//     }
//   })
// );

//         if (!cancelled) {
//           // setJobTitleMap((prev) => {
//           //   const next = { ...prev };
//           //   for (const { id, title } of results) {
//           //     if (!(id in next)) next[id] = title;
//           //   }
//           //   return next;
//           // });

          
//           setJobMetaMap((prev) => {
//             const next = { ...prev };
//             for (const { id, title, requirement_id } of results) {
//               if (!(id in next)) next[id] = { title, requirement_id };
//             }
//             return next;
//           });

//         }
//       } finally {
//         if (!cancelled) setLoadingTitles(false);
//       }
//     }
//     if (items.length > 0) fetchMissingTitles();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [items]);

//   const panelCls = "rounded-xl border border-slate-800 bg-slate-900 shadow-sm";
//   const labelCls = "block text-sm font-medium text-slate-300";
//   const inputCls =
//     "mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
//   const smallBtn = "rounded-md border px-3 py-1.5 text-xs font-medium";

//   const nextPage = () => {
//     if (skip + limit < total) setSkip(skip + limit);
//   };
//   const prevPage = () => {
//     if (skip - limit >= 0) setSkip(skip - limit);
//   };
//   const resetAndSearch = () => {
//     setSkip(0);
//   };

//   return (
//     <div className="fixed inset-0 overflow-auto">
//   {/* Header / Hero (Insights-style gradient) */}
//   <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//     <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//       <div className="mb-2 flex items-center justify-between">
//         <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
//           Scheduled Interviews
//         </h1>
//         {/* Spacer to balance layout if actions are added later */}
//         <div className="hidden sm:block opacity-0">spacer</div>
//       </div>
//       <p className="text-sm text-slate-400">
//         Filter, review, and jump to AI Insights for upcoming interviews.
//       </p>
//     </div>
//   </div>

//   {/* Body */}
//   <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//     {/* Filters */}
//     <section className={`${panelCls} p-4 sm:p-5 mb-6`}>
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
//         <div>
//           <label className={labelCls}>Job ID</label>
//           <input
//             className={inputCls}
//             placeholder="e.g., REQ-2025-1801"
//             value={jobId}
//             onChange={(e) => setJobId(e.target.value)}
//           />
//         </div>

//         <div>
//           <label className={labelCls}>Applicant ID</label>
//           <input
//             className={inputCls}
//             placeholder="e.g., resume_rockwell"
//             value={applicantId}
//             onChange={(e) => setApplicantId(e.target.value)}
//           />
//         </div>

//         <div>
//           <label className={labelCls}>Mode</label>
//           <select
//             className={inputCls}
//             value={mode}
//             onChange={(e) => setMode(e.target.value)}
//           >
//             <option value="">Any</option>
//             <option value="video">Video</option>
//             <option value="onsite">On-site</option>
//             <option value="phone">Phone</option>
//           </select>
//         </div>

//         <div>
//           <label className={labelCls}>Upcoming only</label>
//           <div className="mt-2">
//             <label className="inline-flex items-center gap-2 text-sm text-slate-300">
//               <input
//                 type="checkbox"
//                 className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
//                 checked={upcoming}
//                 onChange={(e) => {
//                   const checked = e.target.checked;
//                   setUpcoming(checked);
//                   setSkip(0);
//                   // ✅ Navigate to Completed page when unchecked
//                   if (!checked) {
//                     navigate("/v1/interviews/completed");
//                   }
//                 }}
//               />
//               Upcoming
//             </label>
//           </div>
//         </div>

//         <div>
//           <label className={labelCls}>Page size</label>
//           <select
//             className={inputCls}
//             value={limit}
//             onChange={(e) => setLimit(Number(e.target.value))}
//           >
//             <option value={10}>10</option>
//             <option value={20}>20</option>
//             <option value={50}>50</option>
//           </select>
//         </div>

//         <div className="flex items-end">
//           <button
//             type="button"
//             className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800 w-full`}
//             onClick={resetAndSearch}
//           >
//             Apply Filters
//           </button>
//         </div>
//       </div>
//     </section>

//     {/* Table */}
//     <section className={`${panelCls} overflow-x-auto`}>
//       <table className="min-w-full divide-y divide-slate-800">
//         <thead className="bg-slate-900/60 sticky top-0 z-10">
//           <tr>
//             <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//               Start (Local)
//             </th>
//             <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//               Job
//             </th>
//             <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//               Applicant
//             </th>
//             <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//               Mode
//             </th>
//             <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//               Panelists
//             </th>
//             {/* Centered headings for action columns */}
//             <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
//               Actions
//             </th>
//             <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
//               Insights
//             </th>
//           </tr>
//         </thead>

//         <tbody className="divide-y divide-slate-800">
//           {loading ? (
//             <tr>
//               <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
//                 Loading…
//               </td>
//             </tr>
//           ) : err ? (
//             <tr>
//               <td colSpan={7} className="px-4 py-8 text-center text-rose-300 bg-rose-900/10">
//                 {err}
//               </td>
//             </tr>
//           ) : items.length === 0 ? (
//             <tr>
//               <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
//                 No interviews found.
//               </td>
//             </tr>
//           ) : (
//             items.map((it) => {
//               const startLocal = utcToLocal(it.start_utc);
//               const panelCount = (it.panelists || []).length;
//               const jobMeta = jobMetaMap[it.job_id];
//               const jobTitle = jobMeta.title;
//               const reqFromJob = jobMeta.requirement_id;
//               const showLoadingTitle = !jobTitle && loadingTitles && Boolean(it.job_id);

//               return (
//                 <tr key={it.id} className="hover:bg-slate-800/40 transition-colors">
//                   {/* Start */}
//                   <td className="px-4 py-3 text-sm text-slate-100 whitespace-nowrap">
//                     {startLocal}
//                   </td>

//                   {/* Job */}
//                   <td className="px-4 py-3 text-sm text-slate-200">
//                     <div className="text-slate-100">
//                       {jobTitle || (showLoadingTitle ? "Loading title…" : "—")}
//                     </div>
//                     <div className="text-xs text-slate-400">{reqFromJob || "--"}</div>
//                   </td>

//                   {/* Applicant */}
//                   <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
//                     {it.applicant_id}
//                   </td>

//                   {/* Mode */}
//                   <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap capitalize">
//                     {it.mode}
//                   </td>

//                   {/* Panelists */}
//                   <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
//                     {panelCount}
//                   </td>

//                   {/* Actions */}
//                   <td className="px-4 py-3 whitespace-nowrap">
//                     <div className="flex justify-center gap-2">
//                       <a
//                         href={API.icsDownload(it.id)}
//                         className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                       >
//                         .ics
//                       </a>
//                       <button
//                         type="button"
//                         className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                         onClick={() => {
//                           const link = API.icsDownload(it.id);
//                           navigator.clipboard.writeText(link).then(() => {
//                             alert("ICS link copied to clipboard");
//                           });
//                         }}
//                       >
//                         Copy Link
//                       </button>
//                     </div>
//                   </td>

//                   {/* Insights */}
//                   <td className="px-4 py-3 whitespace-nowrap">
//                     <div className="flex justify-center">
//                       <button
//                         type="button"
//                         className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                         onClick={() =>
//                           navigate(
//                             `/v1/insights/${encodeURIComponent(it.job_id)}/${encodeURIComponent(
//                               it.applicant_id
//                             )}`
//                           )
//                         }
//                       >
//                         AI Insights
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })
//           )}
//         </tbody>
//       </table>
//     </section>

//     {/* Pagination */}
//     <div className="mt-4 flex items-center justify-between">
//       <div className="text-sm text-slate-400">
//         Showing{" "}
//         <span className="text-slate-200">{Math.min(total, skip + 1)}</span>–
//         <span className="text-slate-200">
//           {Math.min(total, skip + items.length)}
//         </span>{" "}
//         of <span className="text-slate-200">{total}</span>
//       </div>
//       <div className="flex items-center gap-2">
//         <button
//           className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
//           onClick={prevPage}
//           disabled={skip === 0}
//         >
//           Previous
//         </button>
//         <button
//           className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
//           onClick={nextPage}
//           disabled={skip + limit >= total}
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   </div>
// </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const API_BASE = "http://localhost:8000";
const API = {
  listInterviews: (params) => {
    const qs = new URLSearchParams(params);
    return `${API_BASE}/v1/interviews?${qs.toString()}`;
  },
  icsDownload: (id) => `${API_BASE}/v1/interviews/${encodeURIComponent(id)}/ics`,
  getJob: (job_id) => `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}`,
};
// Safe JSON
async function safeJson(res) {
  const text = await res.text();
  const ct = res.headers.get("content-type") || "";
  const looksJson =
    ct.includes("application/json") ||
    (/^\s*\[\[\{\]/.test(text) && /\[\]\}\]\s*$/.test(text));
  if (looksJson) {
    try {
      return JSON.parse(text);
    } catch {}
  }
  throw new Error(`Expected JSON (${ct}), got: ${text.slice(0, 200)}`);
}
// UTC -> Local
function utcToLocal(dtIso, options) {
  try {
    const d = new Date(dtIso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      ...options,
    }).format(d);
  } catch {
    return dtIso;
  }
}
export default function InterviewsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const [jobId, setJobId] = useState("");
  const [applicantId, setApplicantId] = useState("");
  const [mode, setMode] = useState("");
  const [upcoming, setUpcoming] = useState(true); // default: upcoming
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // ✅ Cache job meta (title + requirement_id)
  const [jobMetaMap, setJobMetaMap] = useState({});
  const [loadingTitles, setLoadingTitles] = useState(false);

  const params = useMemo(() => {
    const p = { limit, skip };
    if (jobId.trim()) p.job_id = jobId.trim();
    if (applicantId.trim()) p.applicant_id = applicantId.trim();
    if (mode) p.mode = mode;
    if (upcoming) p.upcoming = "true";
    return p;
  }, [limit, skip, jobId, applicantId, mode, upcoming]);

  // Load interviews
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(API.listInterviews(params), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = await safeJson(res);
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setTotal(data.total ?? 0);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params]);

  // Fetch missing job meta (title + requirement_id) in batch
  useEffect(() => {
    let cancelled = false;
    async function fetchMissingMeta() {
      const uniqueIds = Array.from(
        new Set((items ?? []).map((it) => it.job_id).filter(Boolean))
      );
      const missing = uniqueIds.filter((id) => !(id in jobMetaMap));
      if (missing.length === 0) return;

      setLoadingTitles(true);
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const res = await fetch(API.getJob(id), {
                headers: { Accept: "application/json" },
              });
              if (!res.ok) throw new Error();
              const job = await safeJson(res);
              return {
                id,
                title: job?.title ?? "",
                // Support snake_case or camelCase from API
                requirement_id: job?.requirement_id ?? job?.requirementId ?? "",
              };
            } catch {
              return { id, title: "", requirement_id: "" };
            }
          })
        );
        if (!cancelled) {
          setJobMetaMap((prev) => {
            const next = { ...prev };
            for (const { id, title, requirement_id } of results) {
              if (!(id in next)) next[id] = { title, requirement_id };
            }
            return next;
          });
        }
      } finally {
        if (!cancelled) setLoadingTitles(false);
      }
    }
    if (items.length > 0) fetchMissingMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const panelCls = "rounded-xl border border-slate-800 bg-slate-900 shadow-sm";
  const labelCls = "block text-sm font-medium text-slate-300";
  const inputCls =
    "mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const smallBtn = "rounded-md border px-3 py-1.5 text-xs font-medium";

  const nextPage = () => {
    if (skip + limit < total) setSkip(skip + limit);
  };
  const prevPage = () => {
    if (skip - limit >= 0) setSkip(skip - limit);
  };
  const resetAndSearch = () => {
    setSkip(0);
  };

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Header / Hero (Insights-style gradient) */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Scheduled Interviews
            </h1>
            {/* Spacer to balance layout if actions are added later */}
            <div className="hidden sm:block opacity-0">spacer</div>
          </div>
          <p className="text-sm text-slate-400">
            Filter, review, and jump to AI Insights for upcoming interviews.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <section className={`${panelCls} p-4 sm:p-5 mb-6`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className={labelCls}>Job ID</label>
              <input
                className={inputCls}
                placeholder="e.g., REQ-2025-1801"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Applicant ID</label>
              <input
                className={inputCls}
                placeholder="e.g., resume_rockwell"
                value={applicantId}
                onChange={(e) => setApplicantId(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Mode</label>
              <select
                className={inputCls}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="">Any</option>
                <option value="video">Video</option>
                <option value="onsite">On-site</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Upcoming only</label>
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    checked={upcoming}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUpcoming(checked);
                      setSkip(0);
                      // ✅ Navigate to Completed page when unchecked
                      if (!checked) {
                        navigate("/v1/interviews/completed");
                      }
                    }}
                  />
                  Upcoming
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls}>Page size</label>
              <select
                className={inputCls}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800 w-full`}
                onClick={resetAndSearch}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className={`${panelCls} overflow-x-auto`}>
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/60 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Start (Local)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Applicant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Panelists
                </th>
                {/* Centered headings for action columns */}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Actions
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Insights
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : err ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-rose-300 bg-rose-900/10"
                  >
                    {err}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No interviews found.
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const startLocal = utcToLocal(it.start_utc);
                  const panelCount = (it.panelists ?? []).length;
                  const jobMeta = jobMetaMap[it.job_id] || {};
                  const jobTitle = jobMeta.title;
                  const reqFromJob = jobMeta.requirement_id;
                  const showLoadingTitle =
                    !jobTitle && loadingTitles && Boolean(it.job_id);

                  return (
                    <tr key={it.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Start */}
                      <td className="px-4 py-3 text-sm text-slate-100 whitespace-nowrap">
                        {startLocal}
                      </td>

                      {/* Job */}
                      <td className="px-4 py-3 text-sm text-slate-200">
                        <div className="text-slate-100">
                          {jobTitle || (showLoadingTitle ? "Loading title…" : "—")}
                        </div>
                        {/* 👇 Requirement ID shown below the title */}
                        <div className="text-xs text-slate-400">
                          {reqFromJob || "—"}
                        </div>
                      </td>

                      {/* Applicant */}
                      <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
                        {it.applicant_id}
                      </td>

                      {/* Mode */}
                      <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap capitalize">
                        {it.mode}
                      </td>

                      {/* Panelists */}
                      <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
                        {panelCount}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <a
                            href={API.icsDownload(it.id)}
                            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            .ics
                          </a>
                          <button
                            type="button"
                            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            onClick={() => {
                              const link = API.icsDownload(it.id);
                              navigator.clipboard.writeText(link).then(() => {
                                alert("ICS link copied to clipboard");
                              });
                            }}
                          >
                            Copy Link
                          </button>
                        </div>
                      </td>

                      {/* Insights */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            onClick={() =>
                              navigate(
                                `/v1/insights/${encodeURIComponent(it.job_id)}/${encodeURIComponent(
                                  it.applicant_id
                                )}`
                              )
                            }
                          >
                            AI Insights
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing{" "}
            <span className="text-slate-200">{Math.min(total, skip + 1)}</span>–{" "}
            <span className="text-slate-200">
              {Math.min(total, skip + items.length)}
            </span>{" "}
            of <span className="text-slate-200">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
              onClick={prevPage}
              disabled={skip === 0}
            >
              Previous
            </button>
            <button
              className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
              onClick={nextPage}
              disabled={skip + limit >= total}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
