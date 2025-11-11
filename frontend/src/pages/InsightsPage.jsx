import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

/** ---------------------------
 *  Utilities (icons + helpers)
 *  --------------------------- */
const IconSparkles = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M9.75 4.5l1.06 2.12 2.12 1.06-2.12 1.06-1.06 2.12-1.06-2.12-2.12-1.06 2.12-1.06L9.75 4.5zm8.25 3.75l.88 1.76 1.76.88-1.76.88-.88 1.76-.88-1.76-1.76-.88 1.76-.88.88-1.76zM8.25 15l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z"/>
  </svg>
);

const IconClipboard = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M9 2h6a2 2 0 012 2v1h1a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1V4a2 2 0 012-2zm0 3V4h6v1H9z"/>
  </svg>
);

const IconDownload = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4A1 1 0 118.707 11.293L11 13.586V4a1 1 0 011-1zM5 20a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z"/>
  </svg>
);

const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.65 6.35A8 8 0 104 12h2a6 6 0 116-6V3l4 4-4 4V7a4 4 0 104 4h2a6 6 0 11-6-6 6 6 0 016.65 1.35z"/>
  </svg>
);

const classNames = (...xs) => xs.filter(Boolean).join(" ");
const toPercent = (n) => Math.max(0, Math.min(100, Math.round(n)));

/** ---------------------------
 *  API
 *  --------------------------- */
const API_BASE = "http://localhost:8000";

async function fetchInsights(jobId, applicantId) {
  const res = await fetch(`${API_BASE}/v1/insights/${jobId}/${applicantId}`);
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  const json = await res.json();
  return json?.data || json;
}

/** ---------------------------
 *  Visuals: Donut + Bar
 *  --------------------------- */
function Donut({ value = 0, label = "", color = "#6366F1" }) {
  const radius = 38;
  const stroke = 10;
  const norm = Math.min(100, Math.max(0, value));
  const c = 2 * Math.PI * radius;
  const dash = (norm / 100) * c;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} stroke="#1f2937" strokeOpacity="0.2" strokeWidth={stroke} fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          fill="none"
        />
      </svg>
      <div className="absolute text-center rotate-0">
        <div className="text-xl font-bold text-slate-100">{toPercent(value)}%</div>
        <div className="text-[11px] text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "default" }) {
  const map = {
    default: "bg-slate-800 text-slate-200 border border-slate-700",
    good: "bg-emerald-900/30 text-emerald-300 border border-emerald-700/40",
    warn: "bg-amber-900/30 text-amber-300 border border-amber-700/40",
    bad: "bg-rose-900/30 text-rose-300 border border-rose-700/40",
    info: "bg-indigo-900/30 text-indigo-300 border border-indigo-700/40",
  };
  return <span className={classNames("px-2.5 py-1 rounded-full text-xs", map[tone])}>{children}</span>;
}

/** ---------------------------
 *  Safe getters
 *  --------------------------- */
const arr = (x) => (Array.isArray(x) ? x : []);
const text = (x) => (x == null ? "" : String(x));

/** ---------------------------
 *  Main Page
 *  --------------------------- */
export default function InsightsPage() {
  const { jobId, applicantId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetchInsights(jobId, applicantId);
      setData(res);
    } catch (e) {
      setErr(e?.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, applicantId]);

  const {
    job = {},
    applicant = {},
    scores = {},
    skills = {},
    clarifications = [],
    highlights = [],
    redFlags = [],
    questions = [],
  } = data || {};

  const matchedSkills = useMemo(() => arr(skills.matched), [skills]);
  const gapSkills = useMemo(() => arr(skills.gaps), [skills]);
  const extraSkills = useMemo(() => arr(skills.extras), [skills]);

  const summaryText = useMemo(() => {
    if (!data) return "";
    return [
      `AI Insights Summary`,
      `Job: ${text(job.title)} [${text(job.id)}]`,
      `Applicant: ${text(applicant.name)} [${text(applicant.id)}]`,
      `Overall: ${toPercent(scores.overall || 0)}% | Skills Match: ${toPercent(scores.skillsMatch || 0)}% | JD Coverage: ${toPercent(scores.jdCoverage || 0)}%`,
      ``,
      `Top Skills: ${matchedSkills.join(", ") || "-"}`,
      `Gaps: ${gapSkills.join(", ") || "-"}`,
      `Extras: ${extraSkills.join(", ") || "-"}`,
      ``,
      `JD Highlights:`,
      ...arr(job.jdHighlights).map((h) => `  - ${h}`),
      ``,
      `Clarifications:`,
      ...arr(clarifications).map((c, i) => `  ${i + 1}. ${c}`),
      ``,
      `Highlights:`,
      ...arr(highlights).map((h, i) => `  ${i + 1}. ${h}`),
      ``,
      `Potential Risks / Red Flags:`,
      ...arr(redFlags).map((r, i) => `  ${i + 1}. ${r}`),
    ].join("\n");
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      alert("Summary copied to clipboard.");
    } catch {
      alert("Could not copy. Your browser may block clipboard access.");
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insights_${jobId}_${applicantId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Header / Hero */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <Link to="/" className="hover:text-slate-200">Dashboard</Link>
                <span>›</span>
                <Link to="/v1/insights" className="hover:text-slate-200">AI Insights</Link>
                <span>›</span>
                <span className="text-slate-300">Session</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-100">
                AI Insights — Interview Assist
              </h1>
              <p className="mt-1 max-w-2xl text-slate-400">
                Tailored guidance for panelists using the applicant’s resume vs job description.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="info">Job ID: {text(jobId)}</Pill>
                <Pill tone="info">Applicant ID: {text(applicantId)}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                disabled={loading}
                title="Regenerate insights"
              >
                <IconRefresh className={classNames("h-4 w-4", loading && "animate-spin")} />
                {loading ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                onClick={copySummary}
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <IconClipboard className="h-4 w-4" />
                Copy Summary
              </button>
              <button
                onClick={exportJson}
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <IconDownload className="h-4 w-4" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Loading / Error */}
        {err ? (
          <div className="rounded-md border border-rose-700 bg-rose-900/20 p-4">
            <p className="font-semibold text-rose-300">Error</p>
            <p className="text-rose-200/80">{err}</p>
          </div>
        ) : null}

        {loading && !data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-live="polite">
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
                  <div className="h-24 w-24 rounded-full mx-auto bg-slate-800 animate-pulse" />
                  <div className="mt-4 h-4 bg-slate-800 animate-pulse rounded" />
                </div>
              ))}
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
                <div className="h-6 w-2/3 bg-slate-800 animate-pulse rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 animate-pulse rounded" />
                  <div className="h-3 bg-slate-800 animate-pulse rounded w-5/6" />
                  <div className="h-3 bg-slate-800 animate-pulse rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scorecards */}
            <section className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <IconSparkles className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-slate-300">Overall Fit</h2>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Donut value={scores.overall || 0} label="Overall" color="#8B5CF6" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <IconSparkles className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-slate-300">Skills Match</h2>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Donut value={scores.skillsMatch || 0} label="Skills" color="#6366F1" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <IconSparkles className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-slate-300">JD Coverage</h2>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Donut value={scores.jdCoverage || 0} label="JD" color="#22D3EE" />
                </div>
              </div>
            </section>

            {/* Job Overview */}
            {/* <section className="col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-100">Job Overview</h3>
              <div className="mt-3 space-y-1 text-sm text-slate-300">
                <div><span className="text-slate-400">Title:</span> {text(job.title)}</div>
                <div><span className="text-slate-400">Seniority:</span> {text(job.seniority)}</div>
                <div><span className="text-slate-400">Location:</span> {text(job.location)}</div>
                <div><span className="text-slate-400">Department:</span> {text(job.department)}</div>
              </div>
              {arr(job.jdHighlights).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-300">JD Highlights</h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300 list-disc pl-5 max-h-48 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                    {arr(job.jdHighlights).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Applicant Overview */}
            {/* <section className="col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-100">Applicant Overview</h3>
              <div className="mt-3 space-y-1 text-sm text-slate-300">
                <div><span className="text-slate-400">Name:</span> {text(applicant.name)}</div>
                <div><span className="text-slate-400">Current Role:</span> {text(applicant.currentRole)}</div>
                <div><span className="text-slate-400">Experience:</span> {text(applicant.expYears)} years</div>
              </div>
              {text(applicant.resumeSummary) && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-slate-300">Summary</h4>
                  <div className="mt-1 text-sm text-slate-300 max-h-56 overflow-auto pr-1 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-slate-700/60">
                    {applicant.resumeSummary}
                  </div>
                </div>
              )}
            </section> */}

            {/* Missing from Resume (gaps) */}
            <section className="col-span-1 lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-100">Missing from Resume (present in JD)</h3>
              <p className="mt-1 text-sm text-slate-400">Items panelists should probe to verify exposure and depth.</p>
              <div className="mt-4 space-y-3 max-h-76 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                {gapSkills.length === 0 ? (
                  <div className="text-sm text-slate-400">No gaps detected from the current parsing.</div>
                ) : (
                  gapSkills.map((gap, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                          <div className="font-medium text-slate-200">{gap}</div>
                        </div>
                        <Pill tone="warn">Probe</Pill>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Skills Breakdown */}
            <section className="col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-100">Skills Breakdown</h3>
              <div className="mt-4 space-y-3 max-h-48 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                {matchedSkills.length === 0 ? (
                  <div className="text-sm text-slate-400">No matched skills detected from the current parsing.</div>
                ) : (
                  matchedSkills.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Pill tone="good">Matched</Pill>
                        <span className="font-medium text-slate-200">{s}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold text-slate-300">Bonus / Nice-to-have</h4>
                <div className="mt-2 flex flex-wrap gap-2 max-h-24 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                  {extraSkills.length === 0 ? (
                    <span className="text-xs text-slate-400">None listed</span>
                  ) : (
                    extraSkills.map((x, i) => (
                      <Pill key={i} tone="info">{x}</Pill>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Interview Questions */}
            <section className="col-span-1 lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">Potential Interview Questions</h3>
                <Pill tone="default">Guide only — probe with examples</Pill>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-150 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                {arr(questions).map((q, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <h4 className="text-sm font-semibold text-slate-200">{q.category}</h4>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                      {arr(q.items).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Panelist Aids */}
            <section className="col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-100">Panelist Aids</h3>

              <div className="mt-3">
                <h4 className="text-sm font-semibold text-slate-300">Clarifications Needed</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-300 max-h-40 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                  {arr(clarifications).map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-300">Highlights</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-300 max-h-40 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                  {arr(highlights).map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-300">Potential Risks / Red Flags</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-300 max-h-40 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                  {arr(redFlags).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Suggested Interview Script */}
            <section className="col-span-1 lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <IconSparkles className="h-5 w-5 text-fuchsia-400" />
                <h3 className="text-lg font-semibold text-slate-100">Suggested Interview Script</h3>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="font-semibold text-slate-200">Opening</h4>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-300">
                    <li>Brief intro; outline interview structure and focus areas.</li>
                    <li>Confirm candidate’s preferred project example to discuss.</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="font-semibold text-slate-200">Deep Dive</h4>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-300">
                    <li>Probe missing items (PI planning, ownership, documentation, debugging).</li>
                    <li>Walk through a challenging design/integration decision and trade-offs.</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="font-semibold text-slate-200">Close</h4>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-300">
                    <li>Allow questions; align on expectations &amp; timelines.</li>
                    <li>Share next steps and feedback window.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <pre className="whitespace-pre-wrap text-xs text-slate-300 max-h-56 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
                  {summaryText}
                </pre>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-slate-500">
          Built for panelists • AI assistance to inform, not replace judgment.
        </div>
      </footer>
    </div>
  );
}