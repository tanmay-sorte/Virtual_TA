import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Jobs() {
  const navigate = useNavigate();

  // --- UI state ---
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(Math.max(total, rows.length) / limit));

  // Keep if you’ll extend server-side params later
  const params = useMemo(() => ({ page, limit, sort: "opening_date", order: "asc" }), [page, limit]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        const res = await fetch(`${base}/v1/jobs?${qs.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed to load jobs (${res.status})`);
        }

        const data = await res.json(); // { items, total }
        const items = Array.isArray(data?.items) ? data.items.map(normalizeJobRow) : [];

        setRows(items);
        setTotal(Number.isFinite(data?.total) ? data.total : items.length);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err?.message || "Failed to load jobs");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [params]);

  // ---- Handlers ----
  function onRowClick(job) {
    if (!job?.id) return;
    navigate(`/v1/jobs/${job.id}/applications`);
  }

  function onUpdate(job, e) {
    e.stopPropagation();
    if (!job?.id) return;
    navigate(`/v1/jobs/${job.id}/update`);
  }

  function onUpload(job, e) {
    e.stopPropagation();
    if (!job?.id) return;
    navigate(`/v1/jobs/${job.id}/upload`);
  }

  function onCreate() {
    navigate("/v1/jobs/create");
  }

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Header / Hero */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold text-slate-100">
                Virtual TA <span className="text-indigo-400">Jobs</span>
              </div>
              <span className="hidden sm:inline-block text-sm text-slate-400">
                Currently Open Jobs
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCreate}
                className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                + Create Job
              </button>
              <button
                type="button"
                onClick={() => navigate("/v1/interviews")}
                className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                Go to Interviews
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/60">
                <tr>
                  <Th>Requirement ID</Th>
                  <Th>Title</Th>
                  <Th>Opening</Th>
                  <Th>Closing</Th>
                  <Th>Applicants</Th>
                  <Th>Slots</Th>
                  <Th>Status</Th>
                  <Th className="text-right pr-4">Actions</Th>
                  <Th className="text-right pr-4">Upload</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <SkeletonRows rows={6} />
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-sm text-rose-300 bg-rose-900/10">
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-sm text-slate-300">
                      No jobs found. Click{" "}
                      <button
                        onClick={onCreate}
                        className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                      >
                        Create Job
                      </button>{" "}
                      to add one.
                    </td>
                  </tr>
                ) : (
                  rows.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onRowClick(job)}
                    >
                      <Td>{job.requirement_id}</Td>

                      {/* Title + derived chips */}
                      <Td className="max-w-[36ch] truncate">
                        <span className="align-middle">{job.title}</span>
                        <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                          {/* Past closing takes precedence */}
                          {job._derived?.isPastClosing && (
                            <Chip color="rose">Past closing</Chip>
                          )}

                          {/* Closes today */}
                          {!job._derived?.isPastClosing &&
                            job._derived?.closesToday && (
                              <Chip color="amber">Closes today</Chip>
                            )}

                          {/* Closes in N days (e.g., within 14 days window) */}
                          {!job._derived?.isPastClosing &&
                            !job._derived?.closesToday &&
                            Number.isInteger(job._derived?.closesInDays) &&
                            job._derived?.closesInDays > 0 &&
                            job._derived?.closesInDays <= 3 && (
                              <Chip color="amber">
                                {`Closes in ${job._derived?.closesInDays} day${
                                  job._derived?.closesInDays > 1 ? "s" : ""
                                }`}
                              </Chip>
                            )}

                          {/* Optional: Opens in future */}
                          {job._derived?.opensInFuture && (
                            <Chip color="indigo">
                              {job.opening_date !== "-" ? `Opens ${job.opening_date}` : "Opens soon"}
                            </Chip>
                          )}
                        </span>
                      </Td>

                      <Td>{job.opening_date}</Td>
                      <Td>{job.closing_date}</Td>
                      <Td>{job.applicants_count}</Td>
                      <Td>{job.slots}</Td>
                      <Td>
                        <StatusBadge status={job.status} />
                      </Td>
                      <Td className="text-right pr-4">
                        <button
                          onClick={(e) => onUpdate(job, e)}
                          className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          Update
                        </button>
                      </Td>
                      <Td>
                        <button
                          onClick={(e) => onUpload(job, e)}
                          className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            Upload
                          </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-sm">
            <div className="text-slate-400">
              Page {page} of {totalPages} • {Math.max(total, rows.length)} total
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-slate-200 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-slate-200 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          <a className="hover:underline">Need Help, Contact Admin</a>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers (UI) ---------- */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-sm text-slate-800 dark:text-slate-100 ${className}`}>
      {children}
    </td>
  );
}

function Chip({ children, color = "slate" }) {
  const styles = {
    rose: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
    amber: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    indigo: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30",
    slate: "bg-slate-500/10 text-slate-300 border border-slate-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[color]}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = normalizeStatus(status);
  const cls =
    s === "closed"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      : s === "on-hold"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
      {s.replace("_", " ")}
    </span>
  );
}

function SkeletonRows({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-[80%] rounded bg-slate-200 dark:bg-slate-700" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ---------- data shaping (frontend) ---------- */
function normalizeJobRow(row) {
  const opening = parseLocalYMD(row?.opening_date);
  const closing = parseLocalYMD(row?.closing_date);
  const today = startOfDay(new Date());

  // Days until close (date-only comparisons to avoid TZ drift)
  let closesInDays = null;
  if (closing) {
    const diffMs = startOfDay(closing) - today;
    closesInDays = Math.round(diffMs / 86400000); // 86,400,000 ms in a day
  }

  // 🚫 Do NOT compute status from dates. Trust backend.
  const status = normalizeStatus(row?.status);

  const derived = {
    isPastClosing: closesInDays !== null && closesInDays < 0,
    closesToday: closesInDays === 0,
    closesInDays, // may be negative
    opensInFuture: opening ? startOfDay(opening) > today : false,
    openedToday: opening ? isSameYMD(opening, today) : false,
  };

  return {
    id: row?.id ?? row?._id,
    requirement_id: row?.requirement_id ?? "-",
    title: row?.title ?? "-",
    opening_date: toYMD(opening),
    closing_date: toYMD(closing),
    applicants_count: Number(row?.applicants_count ?? 0),
    slots: Number(row?.slots ?? 0),
    status,      // ← backend truth
    _derived: derived, // ← UI-only
  };
}

function normalizeStatus(s) {
  const v = String(s ?? "open").trim().toLowerCase();
  if (v === "open") return "open";
  if (v === "on-hold" || v === "on_hold" || v === "hold") return "on-hold";
  if (v === "closed" || v === "close") return "closed";
  return v;
}

/**
 * Parse 'YYYY-MM-DD' (or any string) to a Date at local midnight.
 * Safer for UI than new Date("YYYY-MM-DD") which can shift by TZ.
 */
function parseLocalYMD(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  const s = String(d);
  // If it's exactly YYYY-MM-DD, parse as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    return new Date(y, m - 1, day, 0, 0, 0, 0);
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toYMD(d) {
  if (!d) return "-";
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "-";
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameYMD(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
