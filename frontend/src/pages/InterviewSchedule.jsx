// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useNavigate, UNSAFE_getPatchRoutesOnNavigationFunction } from "react-router-dom";

// // ---- API base + endpoints (v1) ----
// const API_BASE = "http://localhost:8000";

// const API = {
//   getJob: (job_id) => `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}`,
//   getApplicant: (job_id, applicant_id) =>
//     `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}/applicants/${encodeURIComponent(applicant_id)}`,
//   // Global panelist directory
//   listPanelists: () => `${API_BASE}/v1/panelists`,
//   // Schedule + ICS
//   scheduleInterview: (job_id, applicant_id) =>
//     `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}/applicants/${encodeURIComponent(applicant_id)}/schedule`,
//   icsDownload: (interview_id) =>
//     `${API_BASE}/v1/interviews/${encodeURIComponent(interview_id)}/ics`,
// };

// // Safe JSON helper (prevents .json() on HTML or non-JSON)
// async function safeJson(res) {
//   const text = await res.text();
//   const ct = res.headers.get("content-type") || "";
//   const looksJson =
//     ct.includes("application/json") ||
//     (/^\s*[\[{]/.test(text) && /[\]}]\s*$/.test(text));
//   if (looksJson) {
//     try {
//       return JSON.parse(text);
//     } catch {
//       // fall through to throw below
//     }
//   }
//   throw new Error(
//     `Expected JSON (${ct || "unknown"}), got: ${text.slice(0, 200)}`
//   );
// }

// export default function InterviewSchedulePage() {
//   const navigate = useNavigate();
//   const { job_id, applicant_id } = useParams();
//   const panelSectionRef = useRef(null);

//   // ---------- PLACEHOLDER DATA ----------
//   const job = {
//     id: job_id || "REQ-2025-1801",
//     title: "Software Engineer – Java Swing",
//     requirement_id: "REQ-2025-1801",
//     opening_date: "2025-10-27",
//     closing_date: "2025-11-11",
//     location: "Pune, India",
//     work_mode: "Hybrid, Full time",
//     status: "open",
//     department: "Engineering",
//     description: "Job Description",
//     summary:
//       "Software Engineer plays a key role in the software development lifecycle—design, implementation, and testing activities.",
//   };

//   const applicant = {
//     id: applicant_id || "resume_rockwell",
//     name:
//       (applicant_id &&
//         decodeURIComponent(applicant_id)
//           .replace(/\.[^/.]+$/, "")
//           .replace(/[_-]+/g, " ")
//           .replace(/\b\w/g, (c) => c.toUpperCase())) ||
//       "High Match",
//     email: "resume.rockwell@example.com",
//   };

//   // ---------- FORM STATE ----------
//   const defaultTz = useMemo(
//     () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
//     []
//   );
//   const [date, setDate] = useState("");
//   const [time, setTime] = useState("");
//   const [duration, setDuration] = useState(45);
//   const [timeZone, setTimeZone] = useState(defaultTz);
//   const [mode, setMode] = useState("video"); // "video" | "onsite" | "phone"
//   const [meetingLink, setMeetingLink] = useState("");
//   const [location, setLocation] = useState("");
//   const [notes, setNotes] = useState("");
//   const [scheduleState, setScheduleState] = useState("idle"); // idle | saving | saved | error
//   const [scheduleResult, setScheduleResult] = useState(null);
//   const [scheduleError, setScheduleError] = useState(null);

//   // ---------- PANELISTS (INSIDE SCHEDULE CARD) ----------
//   const [availablePanelists, setAvailablePanelists] = useState([]); // fetched globally
//   const [loadingPanelists, setLoadingPanelists] = useState(false);
//   const [panelistsError, setPanelistsError] = useState(null);

//   // Selected panelists are stored as objects { name?, email }
//   const [selectedPanelists, setSelectedPanelists] = useState([]);

//   // Quick add inside the same card (local add; not persisted to directory here)
//   const [newPanelistName, setNewPanelistName] = useState("");
//   const [newPanelistEmail, setNewPanelistEmail] = useState("");

//   // Fetch global panelists on mount
//   useEffect(() => {
//     let cancelled = false;
//     async function load() {
//       try {
//         setLoadingPanelists(true);
//         setPanelistsError(null);
//         const res = await fetch(API.listPanelists(), {
//           headers: { Accept: "application/json" },
//         });
//         if (!res.ok) throw new Error(`Failed to load panelists (${res.status})`);
//         const list = await safeJson(res);
//         if (!cancelled) setAvailablePanelists(Array.isArray(list) ? list : []);
//       } catch (e) {
//         if (!cancelled) {
//           setAvailablePanelists([]);
//           setPanelistsError(e.message || "Failed to load panelists");
//         }
//       } finally {
//         if (!cancelled) setLoadingPanelists(false);
//       }
//     }
//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const addCustomPanelist = () => {
//     const email = newPanelistEmail.trim();
//     const name = newPanelistName.trim() || undefined;
//     if (!email) return;
//     const dup =
//       selectedPanelists.some(
//         (p) => p.email.toLowerCase() === email.toLowerCase()
//       ) ||
//       availablePanelists.some(
//         (p) => (p.email || "").toLowerCase() === email.toLowerCase()
//       );
//     if (dup) {
//       setNewPanelistEmail("");
//       setNewPanelistName("");
//       return;
//     }
//     // Add to available AND select it (local-only for now)
//     const newP = { name, email };
//     setAvailablePanelists((prev) => [newP, ...prev]);
//     setSelectedPanelists((prev) => [newP, ...prev]);
//     setNewPanelistEmail("");
//     setNewPanelistName("");
//   };

//   const togglePanelist = (p) => {
//     const exists = selectedPanelists.some((x) => x.email === p.email);
//     if (exists) {
//       setSelectedPanelists((prev) => prev.filter((x) => x.email !== p.email));
//     } else {
//       setSelectedPanelists((prev) => [p, ...prev]);
//     }
//   };

//   const removeSelectedPanelist = (email) => {
//     setSelectedPanelists((prev) => prev.filter((x) => x.email !== email));
//   };

//   // ---------- REAL SCHEDULE CALL ----------
//   const scheduleInterview = async () => {
//     if (!date || !time) {
//       alert("Please choose a date and time.");
//       return;
//     }
//     if (selectedPanelists.length === 0) {
//       panelSectionRef.current?.scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//       });
//       return;
//     }

//     setScheduleError(null);
//     setScheduleState("saving");
//     try {
//       const payload = {
//         start: { date, time, timeZone },
//         durationMinutes: Number(duration),
//         mode,
//         meetingLink:
//           mode === "video" ? meetingLink || undefined : undefined,
//         location:
//           mode === "onsite" ? location || undefined : undefined,
//         notes: notes?.trim() || undefined,
//         panelists: selectedPanelists.map((p) => ({
//           name: p.name,
//           email: p.email,
//         })),
//       };

//       const res = await fetch(API.scheduleInterview(job_id, applicant_id), {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         throw new Error(`Schedule failed (${res.status}): ${text}`);
//       }

//       const data = await safeJson(res);
//       setScheduleResult(data);
//       setScheduleState("saved");

//       alert("Interview scheduled successfully! You can now download the .ics file.");

//       setTimeout(() => setScheduleState("idle"), 1200);
//     } catch (e) {
//       setScheduleError(e.message || "Failed to schedule");
//       setScheduleState("error");
//     }
//   };

//   // ---------- STYLES ----------
//   const panelCls = "rounded-xl border border-slate-800 bg-slate-900 shadow-sm";
//   const panelPad = "p-4 sm:p-5";
//   const labelCls = "block text-sm font-medium text-slate-300";
//   const inputCls =
//     "mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
//   const subtleText = "text-xs text-slate-400";

//   // Button style (small, consistent with your list page)
//   const smallBtn = "rounded-md border px-3 py-1.5 text-xs font-medium";

//   return (

//     <div className="fixed inset-0 overflow-auto">
//   {/* Header / Hero (Insights-style gradient) */}
//   <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//     <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
//           Schedule Interview
//         </h1>
//         {/* spacer to mirror controls on list page */}
//         <div className="hidden sm:flex items-center gap-2 opacity-0">
//           <span className="text-slate-400 text-sm">Placeholder</span>
//         </div>
//       </div>
//       {/* Breadcrumbs */}
//       <nav className="mt-2 text-sm text-slate-400">
//         <button
//           onClick={() => navigate(-1)}
//           className="hover:underline underline-offset-2"
//           aria-label="Go back"
//         >
//           Applications
//         </button>
//         <span className="mx-2">/</span>
//         <span className="text-slate-200">Schedule Interview</span>
//       </nav>
//     </div>
//   </div>

//   {/* Body */}
//   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//     {/* 2:1 Grid with stable columns (prevents drift) */}
//     <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
//       {/* LEFT COLUMN */}
//       <div className="min-w-0 space-y-6">
//         {/* Summary Bar */}
//         <section className={`${panelCls} ${panelPad}`}>
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             <div className="min-w-0">
//               <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
//                 Job Title
//               </div>
//               <div className="mt-1 truncate text-slate-100 text-base font-medium">
//                 {job?.title || "—"}
//               </div>
//             </div>

//             <div className="min-w-0">
//               <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
//                 Applicant
//               </div>
//               <div className="mt-1 truncate text-slate-100 text-base font-medium">
//                 {applicant?.name || "Applicant"}
//               </div>
//               {applicant?.email && (
//                 <div className={`${subtleText} truncate`}>{applicant.email}</div>
//               )}
//             </div>

//             <div className="min-w-0">
//               <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
//                 Department
//               </div>
//               <div className="mt-1 truncate text-slate-100 text-base font-medium">
//                 {job?.department || "—"}
//               </div>
//             </div>

//             <div className="min-w-0">
//               <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
//                 Location
//               </div>
//               <div className="mt-1 truncate text-slate-100 text-base font-medium">
//                 {job?.location || "—"}
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Schedule Card WITH Panelists inside */}
//         <section className={`${panelCls} ${panelPad}`}>
//           <div className="flex flex-wrap items-center justify-between gap-3">
//             <h2 className="text-lg font-semibold text-slate-100">Date &amp; Time</h2>
//             <div className="flex items-center gap-2">
//               {["video", "onsite", "phone"].map((m) => {
//                 const active = mode === m;
//                 return (
//                   <button
//                     key={m}
//                     type="button"
//                     onClick={() => setMode(m)}
//                     className={
//                       `${smallBtn} ` +
//                       (active
//                         ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
//                         : "border-slate-700 text-slate-300 hover:bg-slate-800")
//                     }
//                   >
//                     {m === "video" ? "Video" : m === "onsite" ? "On-site" : "Phone"}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="mt-4 grid gap-4 sm:grid-cols-2">
//             <div className="min-w-0">
//               <label className={labelCls}>Date</label>
//               <input
//                 type="date"
//                 className={inputCls}
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//               />
//             </div>
//             <div className="min-w-0">
//               <label className={labelCls}>Time</label>
//               <input
//                 type="time"
//                 className={inputCls}
//                 value={time}
//                 onChange={(e) => setTime(e.target.value)}
//               />
//             </div>
//             <div className="min-w-0">
//               <label className={labelCls}>Duration</label>
//               <select
//                 className={inputCls}
//                 value={duration}
//                 onChange={(e) => setDuration(Number(e.target.value))}
//               >
//                 <option value={30}>30 minutes</option>
//                 <option value={45}>45 minutes</option>
//                 <option value={60}>60 minutes</option>
//                 <option value={90}>90 minutes</option>
//               </select>
//             </div>
//             <div className="min-w-0">
//               <label className={labelCls}>Timezone</label>
//               <input
//                 type="text"
//                 className={inputCls}
//                 value={timeZone}
//                 onChange={(e) => setTimeZone(e.target.value)}
//                 placeholder="e.g., Asia/Kolkata"
//               />
//               <p className={`${subtleText} mt-1`}>
//                 Defaults to your system timezone (IANA).
//               </p>
//             </div>
//           </div>

//           {mode === "video" && (
//             <div className="mt-4 min-w-0">
//               <label className={labelCls}>Meeting Link</label>
//               <input
//                 type="url"
//                 className={inputCls}
//                 value={meetingLink}
//                 onChange={(e) => setMeetingLink(e.target.value)}
//                 placeholder="https://teams.microsoft.com/l/meetup-join/..."
//               />
//             </div>
//           )}

//           {mode === "onsite" && (
//             <div className="mt-4 min-w-0">
//               <label className={labelCls}>Location</label>
//               <input
//                 type="text"
//                 className={inputCls}
//                 value={location}
//                 onChange={(e) => setLocation(e.target.value)}
//                 placeholder="Office address / meeting room"
//               />
//             </div>
//           )}

//           <div className="mt-4 min-w-0">
//             <label className={labelCls}>Notes (optional)</label>
//             <textarea
//               rows={4}
//               className={inputCls}
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//               placeholder="Agenda, preparation, instructions…"
//             />
//           </div>

//           {/* -------- PANELISTS INSIDE THIS CARD -------- */}
//           <div ref={panelSectionRef} className="mt-6 border-t border-slate-800 pt-5">
//             <div className="flex items-center justify-between">
//               <h3 className="text-base font-semibold text-slate-100">
//                 Panelists <span className="ml-1 text-red-400">*</span>
//               </h3>
//               <div className="flex items-center gap-3">
//                 <span className={`${subtleText}`}>{selectedPanelists.length} selected</span>
//                 {loadingPanelists && (
//                   <span className="text-xs text-slate-400">Loading…</span>
//                 )}
//                 {panelistsError && (
//                   <span className="text-xs text-rose-400">Failed to load list</span>
//                 )}
//               </div>
//             </div>

//             {/* Selected chips */}
//             <div className="mt-3 flex flex-wrap gap-2">
//               {selectedPanelists.length === 0 ? (
//                 <span className="text-xs text-slate-400">
//                   Select at least one panelist to enable scheduling.
//                 </span>
//               ) : (
//                 selectedPanelists.map((p) => (
//                   <span
//                     key={p.email}
//                     className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
//                     title={p.email}
//                   >
//                     {p.name || p.email}
//                     <button
//                       onClick={() => removeSelectedPanelist(p.email)}
//                       className="rounded border border-slate-700 px-1 text-[10px] text-slate-300 hover:bg-slate-700/50"
//                       aria-label={`Remove ${p.email}`}
//                     >
//                       ×
//                     </button>
//                   </span>
//                 ))
//               )}
//             </div>

//             {/* Available list with checkboxes */}
//             <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-slate-800">
//               <ul className="divide-y divide-slate-800">
//                 {availablePanelists.map((p) => {
//                   const checked = selectedPanelists.some((x) => x.email === p.email);
//                   return (
//                     <li key={p.email} className="flex items-center justify-between gap-3 px-3 py-2">
//                       <div className="min-w-0">
//                         <div className="truncate text-sm text-slate-100">
//                           {p.name || p.email}
//                         </div>
//                         {p.name && <div className={`${subtleText} truncate`}>{p.email}</div>}
//                       </div>
//                       <label className="inline-flex items-center gap-2 text-xs text-slate-300">
//                         <input
//                           type="checkbox"
//                           className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
//                           checked={checked}
//                           onChange={() => togglePanelist(p)}
//                         />
//                         {checked ? "Selected" : "Select"}
//                       </label>
//                     </li>
//                   );
//                 })}
//               </ul>
//             </div>

//             {/* Quick add panelist inline */}
//             <div className="mt-4 grid gap-3 sm:grid-cols-2">
//               <div>
//                 <label className={`${labelCls} text-xs`}>Panelist Name (optional)</label>
//                 <input
//                   type="text"
//                   className={inputCls}
//                   value={newPanelistName}
//                   onChange={(e) => setNewPanelistName(e.target.value)}
//                   placeholder="e.g., Priya Sharma"
//                 />
//               </div>
//               <div>
//                 <label className={`${labelCls} text-xs`}>Panelist Email</label>
//                 <input
//                   type="email"
//                   className={inputCls}
//                   value={newPanelistEmail}
//                   onChange={(e) => setNewPanelistEmail(e.target.value)}
//                   placeholder="e.g., priya@company.com"
//                 />
//               </div>
//             </div>

//             <div className="mt-3">
//               <button
//                 type="button"
//                 onClick={addCustomPanelist}
//                 className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
//               >
//                 Add Panelist
//               </button>
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="mt-6 flex flex-wrap items-center gap-3">
//             <button
//               type="button"
//               onClick={scheduleInterview}
//               className={
//                 "rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 " +
//                 (scheduleState === "saving"
//                   ? "bg-indigo-500/70 cursor-not-allowed"
//                   : selectedPanelists.length === 0
//                   ? "bg-indigo-500/60 cursor-not-allowed"
//                   : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700")
//               }
//               disabled={scheduleState === "saving" || selectedPanelists.length === 0}
//               title={selectedPanelists.length === 0 ? "Select at least one panelist" : undefined}
//             >
//               {scheduleState === "saving" ? "Scheduling…" : "Schedule Interview"}
//             </button>

//             <button
//               type="button"
//               onClick={() => navigate(-1)}
//               className="rounded-md border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//             >
//               Cancel
//             </button>

//             {scheduleResult?.ics_url && (
//               <a
//                 href={`${API_BASE}${scheduleResult.ics_url}`}
//                 className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               >
//                 Download .ics
//               </a>
//             )}

//             {scheduleResult?.ics_url && (
//               <button
//                 className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                 onClick={() => navigate("/v1/interviews")}
//               >
//                 View All Interviews
//               </button>
//             )}

//             {scheduleError && <span className="text-xs text-rose-400">{scheduleError}</span>}
//           </div>
//         </section>
//       </div>

//       {/* RIGHT COLUMN (sticky) */}
//       <aside className={`${panelCls} ${panelPad} h-max min-w-0 lg:sticky lg:top-6`}>
//         <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-100">
//           {job?.title || "Job Title"}
//         </h2>

//         <span className="mt-3 inline-flex items-center rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
//           {job?.status || "open"}
//         </span>

//         <dl className="mt-5 space-y-4 text-sm">
//           <div className="grid grid-cols-3 gap-2">
//             <dt className="text-slate-400">Requirement ID</dt>
//             <dd className="col-span-2 text-slate-200">{job?.requirement_id || "—"}</dd>
//           </div>
//           <div className="grid grid-cols-3 gap-2">
//             <dt className="text-slate-400">Opening Date</dt>
//             <dd className="col-span-2 text-slate-200">{job?.opening_date || "—"}</dd>
//           </div>
//           <div className="grid grid-cols-3 gap-2">
//             <dt className="text-slate-400">Closing Date</dt>
//             <dd className="col-span-2 text-slate-200">{job?.closing_date || "—"}</dd>
//           </div>
//           <div className="grid grid-cols-3 gap-2">
//             <dt className="text-slate-400">Location</dt>
//             <dd className="col-span-2 text-slate-200">{job?.location || "—"}</dd>
//           </div>
//           <div className="grid grid-cols-3 gap-2">
//             <dt className="text-slate-400">Work Mode</dt>
//             <dd className="col-span-2 text-slate-200">{job?.work_mode || "—"}</dd>
//           </div>
//         </dl>

//         <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
//           Description
//         </h3>
//         <div
//           className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 whitespace-pre-line
//                      scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40"
//           role="region"
//           aria-label="Job Description"
//         >
//           {job?.description || "—"}
//         </div>

//         <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
//           Summary
//         </h3>
//         <div
//           className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 whitespace-pre-line
//                      scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40"
//           role="region"
//           aria-label="Job Summary"
//         >
//           {job?.summary || "—"}
//         </div>
//       </aside>
//     </div>
//   </div>
// </div>
//   );
// }

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ---- API base + endpoints (v1) ----
const API_BASE = "http://localhost:8000";

const API = {
  getJob: (job_id) => `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}`,
  getApplicant: (job_id, applicant_id) =>
    `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}/applicants/${encodeURIComponent(applicant_id)}`,
  // Global panelist directory
  listPanelists: () => `${API_BASE}/v1/panelists`,
  // Schedule + ICS
  scheduleInterview: (job_id, applicant_id) =>
    `${API_BASE}/v1/jobs/${encodeURIComponent(job_id)}/applicants/${encodeURIComponent(applicant_id)}/schedule`,
  icsDownload: (interview_id) =>
    `${API_BASE}/v1/interviews/${encodeURIComponent(interview_id)}/ics`,
};

// Safe JSON helper (prevents .json() on HTML or non-JSON)
async function safeJson(res) {
  const text = await res.text();
  const ct = res.headers.get("content-type") || "";
  const looksJson =
    ct.includes("application/json") ||
    (/^\s*[\[{]/.test(text) && /[\]}]\s*$/.test(text));
  if (looksJson) {
    try {
      return JSON.parse(text);
    } catch {
      // fall through to throw below
    }
  }
  throw new Error(
    `Expected JSON (${ct || "unknown"}), got: ${text.slice(0, 200)}`
  );
}

// Fallback: pretty name from applicant_id (when backend doesn't provide name)
function prettyNameFromId(id) {
  if (!id) return "Applicant";
  try {
    return decodeURIComponent(id)
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return id;
  }
}

export default function InterviewSchedulePage() {
  const navigate = useNavigate();
  const { job_id, applicant_id } = useParams();
  const panelSectionRef = useRef(null);

  // ---------- JOB (from backend) ----------
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");

  // ---------- APPLICANT (from backend) ----------
  const [applicant, setApplicant] = useState(null);
  const [applicantLoading, setApplicantLoading] = useState(false);
  const [applicantError, setApplicantError] = useState("");


  const LOCAL_RESUME_BASE = "C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes";

  // ---------- FORM STATE ----------
  const defaultTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(45);
  const [timeZone, setTimeZone] = useState(defaultTz);
  const [mode, setMode] = useState("video"); // "video" | "onsite" | "phone"
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduleState, setScheduleState] = useState("idle"); // idle | saving | saved | error
  const [scheduleResult, setScheduleResult] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);

  // ---------- PANELISTS (INSIDE SCHEDULE CARD) ----------
  const [availablePanelists, setAvailablePanelists] = useState([]); // fetched globally
  const [loadingPanelists, setLoadingPanelists] = useState(false);
  const [panelistsError, setPanelistsError] = useState(null);

  // Selected panelists are stored as objects { name?, email }
  const [selectedPanelists, setSelectedPanelists] = useState([]);

  // Quick add inside the same card (local add; not persisted to directory here)
  const [newPanelistName, setNewPanelistName] = useState("");
  const [newPanelistEmail, setNewPanelistEmail] = useState("");

  // Fetch global panelists on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingPanelists(true);
        setPanelistsError(null);
        const res = await fetch(API.listPanelists(), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load panelists (${res.status})`);
        const list = await safeJson(res);
        if (!cancelled) setAvailablePanelists(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          setAvailablePanelists([]);
          setPanelistsError(e.message || "Failed to load panelists");
        }
      } finally {
        if (!cancelled) setLoadingPanelists(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch job details
  useEffect(() => {
    if (!job_id) return;
    const ctl = new AbortController();
    let mounted = true;

    async function loadJob() {
      try {
        setJobLoading(true);
        setJobError("");
        const res = await fetch(API.getJob(job_id), {
          signal: ctl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to fetch job (${res.status})`);
        const data = await safeJson(res);
        const nextJob = data?.job ?? (data?.title ? data : null);
        if (mounted) setJob(nextJob);
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (mounted) {
          setJob(null);
          setJobError(e.message || "Unable to load job details.");
        }
      } finally {
        if (mounted) setJobLoading(false);
      }
    }

    loadJob();
    return () => {
      mounted = false;
      ctl.abort();
    };
  }, [job_id]);

  // Fetch applicant details
  useEffect(() => {
    if (!job_id || !applicant_id) return;
    const ctl = new AbortController();
    let mounted = true;

    async function loadApplicant() {
      try {
        setApplicantLoading(true);
        setApplicantError("");
        const res = await fetch(API.getApplicant(job_id, applicant_id), {
          signal: ctl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to fetch applicant (${res.status})`);
        const data = await safeJson(res);
        const nextApplicant = data?.applicant ?? (data?.email || data?.name ? data : null);
        if (mounted) setApplicant(nextApplicant);
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (mounted) {
          setApplicant(null);
          setApplicantError(e.message || "Unable to load applicant.");
        }
      } finally {
        if (mounted) setApplicantLoading(false);
      }
    }

    loadApplicant();
    return () => {
      mounted = false;
      ctl.abort();
    };
  }, [job_id, applicant_id]);

  const addCustomPanelist = () => {
    const email = newPanelistEmail.trim();
    const name = newPanelistName.trim() || undefined;
    if (!email) return;
    const dup =
      selectedPanelists.some(
        (p) => p.email.toLowerCase() === email.toLowerCase()
      ) ||
      availablePanelists.some(
        (p) => (p.email || "").toLowerCase() === email.toLowerCase()
      );
    if (dup) {
      setNewPanelistEmail("");
      setNewPanelistName("");
      return;
    }
    // Add to available AND select it (local-only for now)
    const newP = { name, email };
    setAvailablePanelists((prev) => [newP, ...prev]);
    setSelectedPanelists((prev) => [newP, ...prev]);
    setNewPanelistEmail("");
    setNewPanelistName("");
  };

  const togglePanelist = (p) => {
    const exists = selectedPanelists.some((x) => x.email === p.email);
    if (exists) {
      setSelectedPanelists((prev) => prev.filter((x) => x.email !== p.email));
    } else {
      setSelectedPanelists((prev) => [p, ...prev]);
    }
  };

  const removeSelectedPanelist = (email) => {
    setSelectedPanelists((prev) => prev.filter((x) => x.email !== email));
  };

  // ---------- REAL SCHEDULE CALL ----------
  const scheduleInterview = async () => {
    if (!date || !time) {
      alert("Please choose a date and time.");
      return;
    }
    if (selectedPanelists.length === 0) {
      panelSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setScheduleError(null);
    setScheduleState("saving");
    try {
      const payload = {
        start: { date, time, timeZone },
        durationMinutes: Number(duration),
        mode,
        meetingLink: mode === "video" ? meetingLink || undefined : undefined,
        location: mode === "onsite" ? location || undefined : undefined,
        notes: notes?.trim() || undefined,
        panelists: selectedPanelists.map((p) => ({
          name: p.name,
          email: p.email,
        })),
      };

      const res = await fetch(API.scheduleInterview(job_id, applicant_id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Schedule failed (${res.status}): ${text}`);
      }

      const data = await safeJson(res);
      setScheduleResult(data);
      setScheduleState("saved");

      alert("Interview scheduled successfully! You can now download the .ics file.");

      setTimeout(() => setScheduleState("idle"), 1200);
    } catch (e) {
      setScheduleError(e.message || "Failed to schedule");
      setScheduleState("error");
    }
  };

  // ---------- STYLES ----------
  const panelCls = "rounded-xl border border-slate-800 bg-slate-900 shadow-sm";
  const panelPad = "p-4 sm:p-5";
  const labelCls = "block text-sm font-medium text-slate-300";
  const inputCls =
    "mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const subtleText = "text-xs text-slate-400";
  const smallBtn = "rounded-md border px-3 py-1.5 text-xs font-medium";

  const applicantDisplayName =
    applicant?.name || prettyNameFromId(applicant_id);
  const applicantDisplayEmail = applicant?.email;

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Header / Hero (Insights-style gradient) */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Schedule Interview
            </h1>
            {/* spacer to mirror controls on list page */}
            <div className="hidden sm:flex items-center gap-2 opacity-0">
              <span className="text-slate-400 text-sm">Placeholder</span>
            </div>
          </div>
          {/* Breadcrumbs */}
          <nav className="mt-2 text-sm text-slate-400">
            <button
              onClick={() => navigate(-1)}
              className="hover:underline underline-offset-2"
              aria-label="Go back"
            >
              Applications
            </button>
            <span className="mx-2">/</span>
            <span className="text-slate-200">Schedule Interview</span>
          </nav>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* 2:1 Grid with stable columns (prevents drift) */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-6">
            {/* Summary Bar */}
            <section className={`${panelCls} ${panelPad}`}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Job Title
                  </div>
                  <div className="mt-1 truncate text-slate-100 text-base font-medium">
                    {jobLoading ? "Loading…" : job?.title || "—"}
                  </div>
                  {jobError && (
                    <div className="mt-1 text-xs text-rose-400 truncate">
                      {jobError}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Applicant
                  </div>
                  <div className="mt-1 truncate text-slate-100 text-base font-medium">
                    {applicantLoading ? "Loading…" : applicantDisplayName || "—"}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Location
                  </div>
                  <div className="mt-1 truncate text-slate-100 text-base font-medium">
                    {job?.location || "—"}
                  </div>
                </div>
              </div>
            </section>

            {/* Schedule Card WITH Panelists inside */}
            <section className={`${panelCls} ${panelPad}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-100">Date &amp; Time</h2>
                <div className="flex items-center gap-2">
                  {["video", "onsite", "phone"].map((m) => {
                    const active = mode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={
                          `${smallBtn} ` +
                          (active
                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                            : "border-slate-700 text-slate-300 hover:bg-slate-800")
                        }
                      >
                        {m === "video" ? "Video" : m === "onsite" ? "On-site" : "Phone"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* === PART 2 CONTENT START === */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="min-w-0">
                  <label className={labelCls}>Time</label>
                  <input
                    type="time"
                    className={inputCls}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="min-w-0">
                  <label className={labelCls}>Duration</label>
                  <select
                    className={inputCls}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={labelCls}>Timezone</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    placeholder="e.g., Asia/Kolkata"
                  />
                  <p className={`${subtleText} mt-1`}>
                    Defaults to your system timezone (IANA).
                  </p>
                </div>
              </div>

              {mode === "video" && (
                <div className="mt-4 min-w-0">
                  <label className={labelCls}>Meeting Link</label>
                  <input
                    type="url"
                    className={inputCls}
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  />
                </div>
              )}

              {mode === "onsite" && (
                <div className="mt-4 min-w-0">
                  <label className={labelCls}>Location</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Office address / meeting room"
                  />
                </div>
              )}

              <div className="mt-4 min-w-0">
                <label className={labelCls}>Notes (optional)</label>
                <textarea
                  rows={4}
                  className={inputCls}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agenda, preparation, instructions…"
                />
              </div>

              {/* -------- PANELISTS INSIDE THIS CARD -------- */}
              <div ref={panelSectionRef} className="mt-6 border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-100">
                    Panelists <span className="ml-1 text-red-400">*</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className={`${subtleText}`}>{selectedPanelists.length} selected</span>
                    {loadingPanelists && (
                      <span className="text-xs text-slate-400">Loading…</span>
                    )}
                    {panelistsError && (
                      <span className="text-xs text-rose-400">Failed to load list</span>
                    )}
                  </div>
                </div>

                {/* Selected chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPanelists.length === 0 ? (
                    <span className="text-xs text-slate-400">
                      Select at least one panelist to enable scheduling.
                    </span>
                  ) : (
                    selectedPanelists.map((p) => (
                      <span
                        key={p.email}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
                        title={p.email}
                      >
                        {p.name || p.email}
                        <button
                          onClick={() => removeSelectedPanelist(p.email)}
                          className="rounded border border-slate-700 px-1 text-[10px] text-slate-300 hover:bg-slate-700/50"
                          aria-label={`Remove ${p.email}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Available list with checkboxes */}
                <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-slate-800">
                  <ul className="divide-y divide-slate-800">
                    {availablePanelists.map((p) => {
                      const checked = selectedPanelists.some((x) => x.email === p.email);
                      return (
                        <li key={p.email} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm text-slate-100">
                              {p.name || p.email}
                            </div>
                            {p.name && <div className={`${subtleText} truncate`}>{p.email}</div>}
                          </div>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                              checked={checked}
                              onChange={() => togglePanelist(p)}
                            />
                            {checked ? "Selected" : "Select"}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Quick add panelist inline */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`${labelCls} text-xs`}>Panelist Name (optional)</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={newPanelistName}
                      onChange={(e) => setNewPanelistName(e.target.value)}
                      placeholder="e.g., Priya Sharma"
                    />
                  </div>
                  <div>
                    <label className={`${labelCls} text-xs`}>Panelist Email</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={newPanelistEmail}
                      onChange={(e) => setNewPanelistEmail(e.target.value)}
                      placeholder="e.g., priya@company.com"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addCustomPanelist}
                    className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
                  >
                    Add Panelist
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scheduleInterview}
                  className={
                    "rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 " +
                    (scheduleState === "saving"
                      ? "bg-indigo-500/70 cursor-not-allowed"
                      : selectedPanelists.length === 0
                      ? "bg-indigo-500/60 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700")
                  }
                  disabled={scheduleState === "saving" || selectedPanelists.length === 0}
                  title={selectedPanelists.length === 0 ? "Select at least one panelist" : undefined}
                >
                  {scheduleState === "saving" ? "Scheduling…" : "Schedule Interview"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-md border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Cancel
                </button>

                {scheduleResult?.ics_url && (
                  <a
                    href={`${API_BASE}${scheduleResult.ics_url}`}
                    className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    Download .ics
                  </a>
                )}

                {scheduleResult?.ics_url && (
                  <button
                    className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onClick={() => navigate("/v1/interviews")}
                  >
                    View All Interviews
                  </button>
                )}

                {scheduleError && <span className="text-xs text-rose-400">{scheduleError}</span>}
              </div>
              {/* === PART 2 CONTENT END === */}
            </section>
          </div>

          {/* RIGHT COLUMN (sticky) */}
          <aside className={`${panelCls} ${panelPad} h-max min-w-0 lg:sticky lg:top-6`}>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-100">
              {jobLoading ? "Loading…" : job?.title || "Job Title"}
            </h2>

            <span className="mt-3 inline-flex items-center rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
              {job?.status || (jobLoading ? "loading…" : "open")}
            </span>

            {jobError && (
              <div className="mt-3 rounded border border-rose-900 bg-rose-900/30 px-3 py-2 text-xs text-rose-300">
                {jobError}
              </div>
            )}

            <dl className="mt-5 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-slate-400">Requirement ID</dt>
                <dd className="col-span-2 text-slate-200">{job?.requirement_id || "—"}</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-slate-400">Opening Date</dt>
                <dd className="col-span-2 text-slate-200">{job?.opening_date || "—"}</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-slate-400">Closing Date</dt>
                <dd className="col-span-2 text-slate-200">{job?.closing_date || "—"}</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="text-slate-400">Location</dt>
                <dd className="col-span-2 text-slate-200">{job?.location || "—"}</dd>
              </div>
              {/* <div className="grid grid-cols-3 gap-2">
                <dt className="text-slate-400">Work Mode</dt>
                <dd className="col-span-2 text-slate-200">{job?.work_mode || "—"}</dd>
              </div> */}
            </dl>

            {/* <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Description
            </h3>
            <div
              className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 whitespace-pre-line
                         scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40"
              role="region"
              aria-label="Job Description"
            >
              {job?.description || "—"}
            </div> */}

            {/* <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Summary
            </h3>
            <div
              className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 whitespace-pre-line
                         scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40"
              role="region"
              aria-label="Job Summary"
            >
              {job?.summary || "—"}
            </div> */}
          </aside>
        </div>
      </div>
    </div>
  );
}


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

// // ✅ Base local folder where requirement folders live (as file:// URL).
// // Original Windows path:
// // C:\Users\TSorte\OneDrive - Rockwell Automation, Inc\Desktop\Virtual_TA (TA-AI)\resumes
// // We encode it for URL safety and prefix with file:///
// const LOCAL_RESUME_BASE = "file:///C:/Users/TSorte/OneDrive%20-%20Rockwell%20Automation,%20Inc/Desktop/Virtual_TA%20(TA-AI)/resumes";

// // Safe JSON
// async function safeJson(res) {
//   const text = await res.text();
//   const ct = res.headers.get("content-type") || "";
//   const looksJson =
//     ct.includes("application/json") ||
//     (/^\s*\[\[\{\]/.test(text) && /\[\]\}\]\s*$/.test(text));
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

//   // ✅ Cache job meta (title + requirement_id)
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

//   // Fetch missing job meta (title + requirement_id) in batch
//   useEffect(() => {
//     let cancelled = false;
//     async function fetchMissingMeta() {
//       const uniqueIds = Array.from(
//         new Set((items ?? []).map((it) => it.job_id).filter(Boolean))
//       );
//       const missing = uniqueIds.filter((id) => !(id in jobMetaMap));
//       if (missing.length === 0) return;

//       setLoadingTitles(true);
//       try {
//         const results = await Promise.all(
//           missing.map(async (id) => {
//             try {
//               const res = await fetch(API.getJob(id), {
//                 headers: { Accept: "application/json" },
//               });
//               if (!res.ok) throw new Error();
//               const job = await safeJson(res);
//               return {
//                 id,
//                 title: job?.title ?? "",
//                 // handle snake_case or camelCase
//                 requirement_id: job?.requirement_id ?? job?.requirementId ?? "",
//               };
//             } catch {
//               return { id, title: "", requirement_id: "" };
//             }
//           })
//         );
//         if (!cancelled) {
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
//     if (items.length > 0) fetchMissingMeta();
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
//       {/* Header / Hero */}
//       <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//         <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//           <div className="mb-2 flex items-center justify-between">
//             <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
//               Scheduled Interviews
//             </h1>
//             <div className="hidden sm:block opacity-0">spacer</div>
//           </div>
//           <p className="text-sm text-slate-400">
//             Filter, review, and jump to AI Insights for upcoming interviews.
//           </p>
//         </div>
//       </div>

//       {/* Body */}
//       <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
//         {/* Filters */}
//         <section className={`${panelCls} p-4 sm:p-5 mb-6`}>
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
//             <div>
//               <label className={labelCls}>Job ID</label>
//               <input
//                 className={inputCls}
//                 placeholder="e.g., REQ-2025-1801"
//                 value={jobId}
//                 onChange={(e) => setJobId(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className={labelCls}>Applicant ID</label>
//               <input
//                 className={inputCls}
//                 placeholder="e.g., resume_rockwell"
//                 value={applicantId}
//                 onChange={(e) => setApplicantId(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className={labelCls}>Mode</label>
//               <select
//                 className={inputCls}
//                 value={mode}
//                 onChange={(e) => setMode(e.target.value)}
//               >
//                 <option value="">Any</option>
//                 <option value="video">Video</option>
//                 <option value="onsite">On-site</option>
//                 <option value="phone">Phone</option>
//               </select>
//             </div>
//             <div>
//               <label className={labelCls}>Upcoming only</label>
//               <div className="mt-2">
//                 <label className="inline-flex items-center gap-2 text-sm text-slate-300">
//                   <input
//                     type="checkbox"
//                     className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
//                     checked={upcoming}
//                     onChange={(e) => {
//                       const checked = e.target.checked;
//                       setUpcoming(checked);
//                       setSkip(0);
//                       if (!checked) {
//                         navigate("/v1/interviews/completed");
//                       }
//                     }}
//                   />
//                   Upcoming
//                 </label>
//               </div>
//             </div>
//             <div>
//               <label className={labelCls}>Page size</label>
//               <select
//                 className={inputCls}
//                 value={limit}
//                 onChange={(e) => setLimit(Number(e.target.value))}
//               >
//                 <option value={10}>10</option>
//                 <option value={20}>20</option>
//                 <option value={50}>50</option>
//               </select>
//             </div>
//             <div className="flex items-end">
//               <button
//                 type="button"
//                 className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800 w-full`}
//                 onClick={resetAndSearch}
//               >
//                 Apply Filters
//               </button>
//             </div>
//           </div>
//         </section>

//         {/* Table */}
//         <section className={`${panelCls} overflow-x-auto`}>
//           <table className="min-w-full divide-y divide-slate-800">
//             <thead className="bg-slate-900/60 sticky top-0 z-10">
//               <tr>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   Start (Local)
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   Job
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   Applicant
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   Mode
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   Panelists
//                 </th>
//                 <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   Actions
//                 </th>
//                 <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   Insights
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-800">
//               {loading ? (
//                 <tr>
//                   <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
//                     Loading…
//                   </td>
//                 </tr>
//               ) : err ? (
//                 <tr>
//                   <td
//                     colSpan={7}
//                     className="px-4 py-8 text-center text-rose-300 bg-rose-900/10"
//                   >
//                     {err}
//                   </td>
//                 </tr>
//               ) : items.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
//                     No interviews found.
//                   </td>
//                 </tr>
//               ) : (
//                 items.map((it) => {
//                   const startLocal = utcToLocal(it.start_utc);
//                   const panelCount = (it.panelists ?? []).length;

//                   const jobMeta = jobMetaMap[it.job_id] || {};
//                   const jobTitle = jobMeta.title;
//                   const reqFromJob = jobMeta.requirement_id;
//                   const showLoadingTitle =
//                     !jobTitle && loadingTitles && Boolean(it.job_id);

//                   // Build local resume href when requirement_id is available.
//                   // Final URL: file:///.../resumes/<requirement_id>/<applicant_id>
//                   let resumeHref = null;
//                   if (reqFromJob) {
//                     const base = LOCAL_RESUME_BASE.replace(/\/+$/, "");
//                     resumeHref = [
//                       base,
//                       encodeURIComponent(reqFromJob),
//                       encodeURIComponent(it.applicant_id),
//                     ].join("/");
//                   }

//                   return (
//                     <tr key={it.id} className="hover:bg-slate-800/40 transition-colors">
//                       {/* Start */}
//                       <td className="px-4 py-3 text-sm text-slate-100 whitespace-nowrap">
//                         {startLocal}
//                       </td>

//                       {/* Job */}
//                       <td className="px-4 py-3 text-sm text-slate-200">
//                         <div className="text-slate-100">
//                           {jobTitle || (showLoadingTitle ? "Loading title…" : "—")}
//                         </div>
//                         {/* Requirement ID under the title */}
//                         <div className="text-xs text-slate-400">
//                           {reqFromJob || "—"}
//                         </div>
//                       </td>

//                       {/* Applicant (linked to local resume path, no extension) */}
//                       <td className="px-4 py-3 text-sm whitespace-nowrap">
//                         {resumeHref ? (
//                           <a
//                             href={resumeHref}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-indigo-300 hover:text-indigo-200 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-sm"
//                             title={`Open resume for ${it.applicant_id}`}
//                           >
//                             {it.applicant_id}
//                           </a>
//                         ) : (
//                           <span className="text-slate-300">{it.applicant_id}</span>
//                         )}
//                       </td>

//                       {/* Mode */}
//                       <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap capitalize">
//                         {it.mode}
//                       </td>

//                       {/* Panelists */}
//                       <td className="px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
//                         {panelCount}
//                       </td>

//                       {/* Actions */}
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <div className="flex justify-center gap-2">
//                           <a
//                             href={API.icsDownload(it.id)}
//                             className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                           >
//                             .ics
//                           </a>
//                           <button
//                             type="button"
//                             className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                             onClick={() => {
//                               const link = API.icsDownload(it.id);
//                               navigator.clipboard.writeText(link).then(() => {
//                                 alert("ICS link copied to clipboard");
//                               });
//                             }}
//                           >
//                             Copy Link
//                           </button>
//                         </div>
//                       </td>

//                       {/* Insights */}
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <div className="flex justify-center">
//                           <button
//                             type="button"
//                             className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                             onClick={() =>
//                               navigate(
//                                 `/v1/insights/${encodeURIComponent(it.job_id)}/${encodeURIComponent(
//                                   it.applicant_id
//                                 )}`
//                               )
//                             }
//                           >
//                             AI Insights
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </section>

//         {/* Pagination */}
//         <div className="mt-4 flex items-center justify-between">
//           <div className="text-sm text-slate-400">
//             Showing{" "}
//             <span className="text-slate-200">{Math.min(total, skip + 1)}</span>–{" "}
//             <span className="text-slate-200">
//               {Math.min(total, skip + items.length)}
//             </span>{" "}
//             of <span className="text-slate-200">{total}</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
//               onClick={prevPage}
//               disabled={skip === 0}
//             >
//               Previous
//             </button>
//             <button
//               className={`${smallBtn} border-slate-700 text-slate-300 hover:bg-slate-800`}
//               onClick={nextPage}
//               disabled={skip + limit >= total}
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
