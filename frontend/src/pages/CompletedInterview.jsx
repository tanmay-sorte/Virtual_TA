import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";
const API = {
  listCompleted: (params) => {
    const qs = new URLSearchParams({ ...params, completed: "true" });
    return `${API_BASE}/v1/interviews?${qs.toString()}`;
  },
  icsDownload: (id) => `${API_BASE}/v1/interviews/${encodeURIComponent(id)}/ics`,
  patchStatus: (id) => `${API_BASE}/v1/interviews/${encodeURIComponent(id)}/status`,
  getJob: (job_id) => `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}`,
};

async function safeJson(res) {
  const text = await res.text();
  const ct = res.headers.get("content-type") || "";
  const looksJson =
    ct.includes("application/json") ||
    (/^\s*[\[{]/.test(text) && /[\]}]\s*$/.test(text));
  if (looksJson) {
    try {
      return JSON.parse(text);
    } catch {}
  }
  throw new Error(`Expected JSON (${ct}), got: ${text.slice(0, 200)}`);
}

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

export default function CompletedInterviewsPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);

  const [jobId, setJobId] = useState("");
  const [applicantId, setApplicantId] = useState("");
  const [mode, setMode] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [jobTitleMap, setJobTitleMap] = useState({});
  const [loadingTitles, setLoadingTitles] = useState(false);

  const params = useMemo(() => {
    const p = { limit, skip };
    if (jobId.trim()) p.job_id = jobId.trim();
    if (applicantId.trim()) p.applicant_id = applicantId.trim();
    if (mode) p.mode = mode;
    return p;
  }, [limit, skip, jobId, applicantId, mode]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(API.listCompleted(params), {
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

  // Fetch job titles
  useEffect(() => {
    let cancelled = false;
    async function fetchMissingTitles() {
      const uniqueIds = Array.from(
        new Set((items || []).map((it) => it.job_id).filter(Boolean))
      );
      const missing = uniqueIds.filter((id) => !(id in jobTitleMap));
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
              return { id, title: job?.title || "" };
            } catch {
              return { id, title: "" };
            }
          })
        );
        if (!cancelled) {
          setJobTitleMap((prev) => {
            const next = { ...prev };
            for (const { id, title } of results) if (!(id in next)) next[id] = title;
            return next;
          });
        }
      } finally {
        if (!cancelled) setLoadingTitles(false);
      }
    }
    if (items.length > 0) fetchMissingTitles();
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

  // PATCH status
  const [savingId, setSavingId] = useState(null);
  const [saveErr, setSaveErr] = useState(null);

  const updateStatus = async (id, status) => {
  setSavingId(id);
  setSaveErr(null);
  try {
    const res = await fetch(API.patchStatus(id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const text = await res.text();
    if (!res.ok) {
      // Try to show server detail, otherwise show raw text
      let message = `Failed (${res.status})`;
      try {
        const j = JSON.parse(text);
        if (j?.detail) message = Array.isArray(j.detail) ? j.detail[0]?.msg || message : j.detail;
      } catch {}
      throw new Error(message + (text ? ` — ${text.slice(0, 140)}` : ""));
    }

    let updated;
    try {
      updated = JSON.parse(text);
    } catch {
      updated = null;
    }

    // Optimistic UI or use the returned doc if provided
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: updated?.status || status } : it))
    );
    // Optional: toast
    // alert("Interview status updated.");
  } catch (e) {
    setSaveErr(e.message || "Failed to update status");
  } finally {
    setSavingId(null);
  }
};

  return (
    // <div className="fixed inset-0 overflow-auto">
    //   {/* Centered container */}
    //   <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
    //     {/* Header */}
    //     <div className="mb-4 flex items-center justify-between">
    //       <h1 className="text-xl font-semibold text-slate-100">
    //         Completed Interviews
    //       </h1>
    //       <div>
    //         {/* Back to Upcoming */}
    //         <button
    //           type="button"
    //           className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
    //           onClick={() => navigate("/v1/interviews")}
    //         >
    //           View Upcoming
    //         </button>
    //       </div>
    //     </div>

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
    //         <thead className="bg-slate-900/60">
    //           <tr>
    //             <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
    //               Ended (Local)
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
    //               Status
    //             </th>
    //             <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
    //               Actions
    //             </th>
    //           </tr>
    //         </thead>
    //         <tbody className="divide-y divide-slate-800">
    //           {loading ? (
    //             <tr>
    //               <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
    //                 Loading…
    //               </td>
    //             </tr>
    //           ) : err ? (
    //             <tr>
    //               <td colSpan={6} className="px-4 py-8 text-center text-red-400">
    //                 {err}
    //               </td>
    //             </tr>
    //           ) : items.length === 0 ? (
    //             <tr>
    //               <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
    //                 No interviews found.
    //               </td>
    //             </tr>
    //           ) : (
    //             items.map((it) => {
    //               const endLocal = utcToLocal(it.end_utc);
    //               const jobTitle = jobTitleMap[it.job_id];
    //               const showLoadingTitle =
    //                 !jobTitle && loadingTitles && Boolean(it.job_id);

    //               return (
    //                 <tr key={it.id} className="hover:bg-slate-800/40">
    //                   <td className="px-4 py-3 text-sm text-slate-100 whitespace-nowrap">
    //                     {endLocal}
    //                   </td>
    //                   <td className="px-4 py-3 text-sm text-slate-200">
    //                     <div className="text-slate-100">
    //                       {jobTitle ||
    //                         (showLoadingTitle ? "Loading title…" : "—")}
    //                     </div>
    //                     <div className="text-xs text-slate-400">{it.job_id}</div>
    //                   </td>
    //                   <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
    //                     {it.applicant_id}
    //                   </td>
    //                   <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap capitalize">
    //                     {it.mode}
    //                   </td>
    //                   <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
    //                     <select
    //                       className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    //                       value={it.status || "completed"}
    //                       onChange={(e) => updateStatus(it.id, e.target.value)}
    //                       disabled={savingId === it.id}
    //                       title="Update interview status"
    //                     >
    //                       <option value="completed">Completed</option>
    //                       <option value="no_show">No-show</option>
    //                       <option value="cancelled">Cancelled</option>
    //                       <option value="rescheduled">Rescheduled</option>
    //                     </select>
    //                     {saveErr && savingId === it.id && (
    //                       <span className="ml-2 text-xs text-red-400">{saveErr}</span>
    //                     )}
    //                   </td>
    //                   <td className="px-4 py-3 whitespace-nowrap">
    //                     <div className="flex justify-center gap-2">
    //                       <a
    //                         href={API.icsDownload(it.id)}
    //                         className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
    //                       >
    //                         .ics
    //                       </a>
    //                       <button
    //                         type="button"
    //                         className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
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
    <div className="fixed inset-0 overflow-auto">
  {/* Header / Hero (Insights-style gradient) */}
  <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          Completed Interviews
        </h1>
        <div>
          {/* Back to Upcoming */}
          <button
            type="button"
            className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
            onClick={() => navigate("/v1/interviews")}
          >
            View Upcoming
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-400">
        Review finished interviews and update their final status if needed.
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

        {/* Spacer to align Apply button to baseline */}
        <div className="lg:col-span-3 flex items-end">
          <button
            type="button"
            className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto`}
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
              Ended (Local)
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
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                Loading…
              </td>
            </tr>
          ) : err ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-rose-300 bg-rose-900/10">
                {err}
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                No interviews found.
              </td>
            </tr>
          ) : (
            items.map((it) => {
              const endLocal = utcToLocal(it.end_utc);
              const jobTitle = jobTitleMap[it.job_id];
              const showLoadingTitle = !jobTitle && loadingTitles && Boolean(it.job_id);

              return (
                <tr key={it.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Ended */}
                  <td className="px-4 py-3 text-sm text-slate-100 whitespace-nowrap">
                    {endLocal}
                  </td>

                  {/* Job */}
                  <td className="px-4 py-3 text-sm text-slate-200">
                    <div className="text-slate-100">
                      {jobTitle || (showLoadingTitle ? "Loading title…" : "—")}
                    </div>
                    <div className="text-xs text-slate-400">{it.job_id}</div>
                  </td>

                  {/* Applicant */}
                  <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
                    {it.applicant_id}
                  </td>

                  {/* Mode */}
                  <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap capitalize">
                    {it.mode}
                  </td>

                  {/* Status (editable) */}
                  <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
                    <select
                      className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                      value={it.status || "completed"}
                      onChange={(e) => updateStatus(it.id, e.target.value)}
                      disabled={savingId === it.id}
                      title="Update interview status"
                    >
                      <option value="completed">Completed</option>
                      <option value="no_show">No-show</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                    {saveErr && savingId === it.id && (
                      <span className="ml-2 text-xs text-rose-400">{saveErr}</span>
                    )}
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
                        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
        <span className="text-slate-200">{Math.min(total, skip + 1)}</span>–
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