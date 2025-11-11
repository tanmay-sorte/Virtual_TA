// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

// export default function UpdateJob() {
//   const navigate = useNavigate();
//   const { job_id } = useParams();

//   const [requirementId, setRequirementId] = useState('');
//   const [title, setTitle] = useState('');
//   const [location, setLocation] = useState('');
//   const [workmode, setWorkMode] = useState('');
//   const [openingDate, setOpeningDate] = useState(new Date());
//   const [closingDate, setClosingDate] = useState(null);
//   const [slots, setSlots] = useState(1);
//   const [status, setStatus] = useState('open');
//   const [jd, setJD] = useState('');

//   // NEW: track submitting state for full-screen loader
//   const [submitting, setSubmitting] = useState(false);

//   // Fetch existing job data
//   useEffect(() => {
//     async function fetchJob() {
//       try {
//         const res = await fetch(`http://localhost:8000/v1/jobs/${job_id}`);
//         if (!res.ok) throw new Error('Failed to fetch job');
//         const data = await res.json();

//         setRequirementId(data.requirement_id ?? '');
//         setTitle(data.title ?? '');
//         setLocation(data.location ?? '');
//         setWorkMode(data.workmode ?? '');
//         // Guard against null/undefined dates from API
//         setOpeningDate(data.opening_date ? new Date(data.opening_date) : new Date());
//         setClosingDate(data.closing_date ? new Date(data.closing_date) : null);
//         setSlots(Number(data.slots ?? 1));
//         setStatus(data.status ?? 'open');
//         setJD(data.jd ?? '');
//       } catch (err) {
//         alert('Failed to load job data.');
//       }
//     }

//     fetchJob();
//   }, [job_id]);

//   // Submit updated job
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const payload = {
//       requirementId,
//       title,
//       location,
//       workmode,
//       opening_date: openingDate ? openingDate.toISOString().split('T')[0] : null,
//       closing_date: closingDate ? closingDate.toISOString().split('T')[0] : null,
//       slots: Number(slots),
//       status,
//       jd,
//     };

//     setSubmitting(true); // show full-screen spinner
//     try {
//       const res = await fetch(`http://localhost:8000/v1/jobs/${job_id}/update`, {
//         method: 'PUT', // or PATCH depending on your backend
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       const result = await res.json();
//       if (!res.ok) throw new Error(result.detail || 'Update failed');

//       alert('Job updated successfully!');
//       navigate('/v1/jobs');
//     } catch (err) {
//       alert(`Error: ${err.message}`);
//     } finally {
//       setSubmitting(false); // hide spinner regardless of success/failure
//     }
//   };

//   // For disabling inputs while submitting
//   const disabled = submitting;

//   return (


//     <div className="fixed inset-0 overflow-auto">
//   {/* Header / Hero (Insights-style gradient) */}
//   <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
//     <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
//       <div className="flex flex-col gap-1">
//         <h1 className="text-2xl font-bold tracking-tight text-slate-100">
//           Virtual TA <span className="text-indigo-400">Update Job</span>
//         </h1>
//         <p className="text-sm text-slate-400">
//           Modify the job details below. Requirement ID cannot be changed.
//         </p>
//       </div>
//     </div>
//   </div>

//   {/* Body */}
//   <div className="mx-auto max-w-3xl px-4 py-8">
//     <div className="mx-auto w-full rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur">
//       <h2 className="text-xl font-semibold tracking-tight text-slate-100">
//         Update Job
//       </h2>
//       <p className="mt-1 text-sm text-slate-400">
//         Keep the role details up to date for panelists and candidates.
//       </p>

//       <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
//         {/* Requirement ID (disabled) */}
//         <div>
//           <label htmlFor="requirement_id" className="block text-sm font-medium text-slate-300">
//             Requirement ID
//           </label>
//           <input
//             id="requirement_id"
//             name="requirement_id"
//             type="text"
//             value={requirementId}
//             disabled
//             className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-2 text-slate-400 outline-none disabled:opacity-80"
//           />
//         </div>

//         {/* Title */}
//         <div>
//           <label htmlFor="title" className="block text-sm font-medium text-slate-300">
//             Title <span className="text-rose-400">*</span>
//           </label>
//           <input
//             id="title"
//             name="title"
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             disabled={disabled}
//             placeholder="e.g., Teaching Assistant - Algorithms"
//             className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//           />
//         </div>

//         {/* Dates */}
//         <div className="grid gap-4 sm:grid-cols-2">
//           <div>
//             <label className="block text-sm font-medium text-slate-300">
//               Opening Date <span className="text-rose-400">*</span>
//             </label>
//             <DatePicker
//               selected={openingDate}
//               onChange={(date) => setOpeningDate(date)}
//               className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//               dateFormat="yyyy-MM-dd"
//               disabled={disabled}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-300">
//               Closing Date <span className="text-rose-400">*</span>
//             </label>
//             <DatePicker
//               selected={closingDate}
//               onChange={(date) => setClosingDate(date)}
//               className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//               dateFormat="yyyy-MM-dd"
//               minDate={openingDate}
//               isClearable
//               placeholderText="Select closing date"
//               disabled={disabled}
//             />
//           </div>
//         </div>

//         {/* Location & Work Mode */}
//         <div className="grid gap-4 sm:grid-cols-2">
//           <div>
//             <label htmlFor="location" className="block text-sm font-medium text-slate-300">
//               Location <span className="text-rose-400">*</span>
//             </label>
//             <input
//               id="location"
//               name="location"
//               type="text"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               placeholder="e.g., Pune, India"
//               disabled={disabled}
//               className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//             />
//           </div>

//           <div>
//             <label htmlFor="workmode" className="block text-sm font-medium text-slate-300">
//               Working Mode <span className="text-rose-400">*</span>
//             </label>
//             <input
//               id="workmode"
//               name="workmode"
//               type="text"
//               value={workmode}
//               onChange={(e) => setWorkMode(e.target.value)}
//               placeholder="e.g., Full-Time/Part-Time or Remote/Hybrid"
//               disabled={disabled}
//               className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//             />
//           </div>
//         </div>

//         {/* Slots & Status */}
//         <div className="grid gap-4 sm:grid-cols-2">
//           <div>
//             <label htmlFor="slots" className="block text-sm font-medium text-slate-300">
//               Slots <span className="text-rose-400">*</span>
//             </label>
//             <input
//               id="slots"
//               name="slots"
//               type="number"
//               min={1}
//               value={slots}
//               onChange={(e) => setSlots(e.target.value)}
//               disabled={disabled}
//               className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//             />
//           </div>

//           <div>
//             <label htmlFor="status" className="block text-sm font-medium text-slate-300">
//               Status <span className="text-rose-400">*</span>
//             </label>
//             <select
//               id="status"
//               name="status"
//               value={status}
//               onChange={(e) => setStatus(e.target.value)}
//               disabled={disabled}
//               className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//             >
//               <option value="open">Open</option>
//               <option value="closed">Closed</option>
//               <option value="on-hold">On-Hold</option>
//             </select>
//           </div>
//         </div>

//         {/* Job Description */}
//         <div>
//           <label htmlFor="jd" className="block text-sm font-medium text-slate-300">
//             Job Description <span className="text-rose-400">*</span>
//           </label>
//           <textarea
//             id="jd"
//             name="jd"
//             value={jd}
//             onChange={(e) => setJD(e.target.value)}
//             placeholder="Responsibilities, Essentials, Preferred."
//             disabled={disabled}
//             rows={6}
//             className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//           />
//         </div>

//         {/* Actions */}
//         <div className="flex items-center gap-3 pt-2">
//           <button
//             type="submit"
//             disabled={disabled}
//             className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//           >
//             {submitting ? "Updating…" : "Update Job"}
//           </button>

//           <button
//             type="button"
//             onClick={() => navigate("/v1/jobs")}
//             disabled={disabled}
//             className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>

//     <div className="h-10" />
//   </div>

//   {/* FULL-SCREEN LOADING OVERLAY */}
//   {submitting && (
//     <div
//       className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
//       role="status"
//       aria-live="assertive"
//       aria-label="Updating job, please wait"
//     >
//       <div className="flex flex-col items-center gap-4">
//         {/* Spinner */}
//         <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
//         <p className="text-white text-sm">Updating job…</p>
//       </div>
//     </div>
//   )}
// </div>
//   );
// }


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function UpdateJob() {
  const navigate = useNavigate();
  const { job_id } = useParams();

  const [requirementId, setRequirementId] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workmode, setWorkMode] = useState('');
  const [openingDate, setOpeningDate] = useState(new Date());
  const [closingDate, setClosingDate] = useState(null);
  const [slots, setSlots] = useState(1);
  const [status, setStatus] = useState('open');
  const [jd, setJD] = useState('');

  // --- submitting state for full-screen loader ---
  const [submitting, setSubmitting] = useState(false);
  const disabled = submitting;

  // --- Weightage (Skills, Experience, Education) ---
  // Represented by two boundaries: split1 (end of Skills), split2 (end of Experience)
  // Skills   = split1
  // Experience = split2 - split1
  // Education  = 100 - split2
  const TOTAL = 100;
  const STEP = 1;
  const MIN_SEGMENT = 5;

  const [split1, setSplit1] = useState(60); // default
  const [split2, setSplit2] = useState(80); // default

  const skillW = split1;
  const expW = split2 - split1;
  const eduW = TOTAL - split2;

  const handleSplit1Change = (e) => {
    const val = Number(e.target.value);
    setSplit1(Math.max(0, Math.min(val, split2 - MIN_SEGMENT)));
  };

  const handleSplit2Change = (e) => {
    const val = Number(e.target.value);
    setSplit2(Math.min(TOTAL, Math.max(val, split1 + MIN_SEGMENT)));
  };

  // Fetch existing job data
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`http://localhost:8000/v1/jobs/${job_id}`);
        if (!res.ok) throw new Error('Failed to fetch job');
        const data = await res.json();

        setRequirementId(data.requirement_id ?? '');
        setTitle(data.title ?? '');
        setLocation(data.location ?? '');
        setWorkMode(data.workmode ?? '');
        setOpeningDate(data.opening_date ? new Date(data.opening_date) : new Date());
        setClosingDate(data.closing_date ? new Date(data.closing_date) : null);
        setSlots(Number(data.slots ?? 1));
        setStatus(data.status ?? 'open');
        setJD(data.jd ?? '');

        // Initialize weightage from backend if present; else fallback 60/20/20
        const w = data.weightage || {};
        const s = Number.isFinite(w.skills) ? Number(w.skills) : 60;
        const e = Number.isFinite(w.experience) ? Number(w.experience) : 20;
        const ed = Number.isFinite(w.education) ? Number(w.education) : 20;

        const total = s + e + ed;
        if (total === 100 && s >= 0 && e >= 0 && ed >= 0) {
          // Convert to split1 / split2 representation
          setSplit1(s);
          setSplit2(s + e);
        } else {
          // fallback
          setSplit1(60);
          setSplit2(80);
        }
      } catch (err) {
        alert('Failed to load job data.');
      }
    }

    fetchJob();
  }, [job_id]);

  // Submit updated job
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      // NOTE: backend expects snake_case keys (keep requirement_id)
      requirement_id: requirementId,
      title,
      location,
      workmode,
      opening_date: openingDate ? openingDate.toISOString().split('T')[0] : null,
      closing_date: closingDate ? closingDate.toISOString().split('T')[0] : null,
      slots: Number(slots),
      status,
      jd,
      weightage: {
        skills: skillW,
        experience: expW,
        education: eduW,
      },
    };

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/v1/jobs/${job_id}/update`, {
        method: 'PUT', // or PATCH if your backend supports partial updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Update failed');

      alert('Job updated successfully!');
      navigate('/v1/jobs');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-auto">
      {/* Header / Hero (Insights-style gradient) */}
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Virtual TA <span className="text-indigo-400">Update Job</span>
            </h1>
            <p className="text-sm text-slate-400">
              Modify the job details below. Requirement ID cannot be changed.
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mx-auto w-full rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm backdrop-blur">
          <h2 className="text-xl font-semibold tracking-tight text-slate-100">
            Update Job
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Keep the role details up to date for panelists and candidates.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Requirement ID (disabled) */}
            <div>
              <label htmlFor="requirement_id" className="block text-sm font-medium text-slate-300">
                Requirement ID
              </label>
              <input
                id="requirement_id"
                name="requirement_id"
                type="text"
                value={requirementId}
                disabled
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-2 text-slate-400 outline-none disabled:opacity-80"
              />
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={disabled}
                placeholder="e.g., Teaching Assistant - Algorithms"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
              />
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Opening Date <span className="text-rose-400">*</span>
                </label>
                <DatePicker
                  selected={openingDate}
                  onChange={(date) => setOpeningDate(date)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                  dateFormat="yyyy-MM-dd"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Closing Date <span className="text-rose-400">*</span>
                </label>
                <DatePicker
                  selected={closingDate}
                  onChange={(date) => setClosingDate(date)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                  dateFormat="yyyy-MM-dd"
                  minDate={openingDate}
                  isClearable
                  placeholderText="Select closing date"
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Location & Work Mode */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-300">
                  Location <span className="text-rose-400">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Pune, India"
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="workmode" className="block text-sm font-medium text-slate-300">
                  Working Mode <span className="text-rose-400">*</span>
                </label>
                <input
                  id="workmode"
                  name="workmode"
                  type="text"
                  value={workmode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  placeholder="e.g., Full-Time/Part-Time or Remote/Hybrid"
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Slots & Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="slots" className="block text-sm font-medium text-slate-300">
                  Slots <span className="text-rose-400">*</span>
                </label>
                <input
                  id="slots"
                  name="slots"
                  type="number"
                  min={1}
                  value={slots}
                  onChange={(e) => setSlots(Number(e.target.value))}
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-300">
                  Status <span className="text-rose-400">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={disabled}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  {/* <option value="on-hold">On-Hold</option> */}
                </select>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label htmlFor="jd" className="block text-sm font-medium text-slate-300">
                Job Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="jd"
                name="jd"
                value={jd}
                onChange={(e) => setJD(e.target.value)}
                placeholder="Responsibilities, Essentials, Preferred."
                disabled={disabled}
                rows={6}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
              />
            </div>

            {/* --- Weightage (Skills, Experience, Education) --- */}
            <div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <label className="block text-sm font-medium text-slate-300">
                  Weightage (must total 100)
                </label>

                {/* Live values */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-1 text-indigo-300">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" /> Skills: {skillW}%
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-1 text-violet-300">
                    <span className="h-2 w-2 rounded-full bg-violet-500" /> Experience: {expW}%
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-1 text-fuchsia-300">
                    <span className="h-2 w-2 rounded-full bg-fuchsia-500" /> Education: {eduW}%
                  </span>
                </div>
              </div>

              <div className="mt-3">
                {/* Slider wrapper */}
                <div className="relative h-10 select-none">
                  {/* Track background */}
                  <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-slate-700" />

                  {/* Segments */}
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-l-full bg-indigo-500/80"
                    style={{ left: '0%', width: `${split1}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 bg-violet-500/80"
                    style={{ left: `${split1}%`, width: `${split2 - split1}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-r-full bg-fuchsia-500/80"
                    style={{ left: `${split2}%`, width: `${100 - split2}%` }}
                  />

                  {/* Thumb A */}
                  <input
                    type="range"
                    min={0}
                    max={TOTAL}
                    step={STEP}
                    value={split1}
                    onChange={handleSplit1Change}
                    disabled={disabled}
                    className="pointer-events-auto absolute left-0 top-0 h-10 w-full appearance-none bg-transparent"
                    aria-label="Adjust boundary between Skills and Experience"
                  />
                  {/* Thumb B */}
                  <input
                    type="range"
                    min={0}
                    max={TOTAL}
                    step={STEP}
                    value={split2}
                    onChange={handleSplit2Change}
                    disabled={disabled}
                    className="pointer-events-auto absolute left-0 top-0 h-10 w-full appearance-none bg-transparent"
                    aria-label="Adjust boundary between Experience and Education"
                  />

                  {/* Thumb styles */}
                  <style>{`
                    input[type="range"] {
                      -webkit-appearance: none;
                    }
                    input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      height: 18px;
                      width: 18px;
                      border-radius: 9999px;
                      background: #818cf8;
                      border: 2px solid #0f172a;
                      box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.25);
                      cursor: pointer;
                      position: relative;
                      z-index: 10;
                    }
                    input[type="range"]::-moz-range-thumb {
                      height: 18px;
                      width: 18px;
                      border-radius: 9999px;
                      background: #818cf8;
                      border: 2px solid #0f172a;
                      box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.25);
                      cursor: pointer;
                      position: relative;
                      z-index: 10;
                    }
                    input[type="range"]::-webkit-slider-runnable-track {
                      height: 1px;
                      background: transparent;
                    }
                    input[type="range"]::-moz-range-track {
                      height: 1px;
                      background: transparent;
                    }
                  `}</style>
                </div>

                {/* Labels under the track */}
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={disabled}
                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-400
                  ${disabled
                    ? 'cursor-not-allowed bg-indigo-500/60'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'}`}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Updating…
                  </span>
                ) : (
                  'Update Job'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/v1/jobs')}
                disabled={disabled}
                className={`inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400
                  ${disabled ? 'cursor-not-allowed bg-slate-900/40 text-slate-400' : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'}`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="h-10" />
      </div>

      {/* FULL-SCREEN LOADING OVERLAY */}
      {submitting && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="status"
          aria-live="assertive"
          aria-label="Updating job, please wait"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-white text-sm">Updating job…</p>
          </div>
        </div>
      )}
    </div>
  );
}