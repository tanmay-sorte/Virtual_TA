// src/App.jsx
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import JobsCreate from "./pages/CreateJobs";
import UpdateJob from "./pages/UpdateJobs";
import JobDetailsPage from "./pages/JobApplication";
import InterviewSchedulePage from "./pages/InterviewSchedule";
import InterviewsListPage from "./pages/InterviewList";
import CompletedInterviewsPage from "./pages/CompletedInterview";
import InsightsPage from "./pages/InsightsPage";
import UploadResumes from "./pages/resumeUpload";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Default route → redirect to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Your login page */}
          <Route path="/login" element={<Login />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/v1/jobs" element={<Jobs />} />
          <Route path="/v1/jobs/create" element={<JobsCreate />} />
          <Route path="/v1/jobs/:job_id/update" element={<UpdateJob />} />
          <Route path="/v1/jobs/:job_id/applications" element={<JobDetailsPage />} />
          <Route path="/v1/jobs/:job_id/:applicant_id/sch_interview" element={<InterviewSchedulePage />} />
          <Route path="/v1/interviews" element={<InterviewsListPage />} />
          <Route path="/v1/interviews/completed" element={<CompletedInterviewsPage />} />
          <Route path="/v1/insights/:jobId/:applicantId" element={<InsightsPage />} />
          <Route path="v1/jobs/:job_id/upload" element={<UploadResumes />} />
          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
     </div>
  );
}

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold">404 — Not found</h2>
      <p className="mt-2">
        Go to{" "}
        <Link className="text-indigo-600 underline" to="/login">
          Login
        </Link>
      </p>
    </div>
  );
}
``