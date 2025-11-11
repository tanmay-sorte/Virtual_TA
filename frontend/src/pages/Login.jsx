import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};

    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "Enter a valid email";


    if (!password) e.password = "Password is required";

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email.trim(),
          password,
        }),
        // If your API sets cookies (sessions), uncomment:
        // credentials: "include",
      });

      // Handle non-2xx responses
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const message =
          errBody?.message ||
          errBody?.error ||
          `Login failed (${res.status})`;
        throw new Error(message);
      }

      const data = await res.json(); // e.g., { token: "...", user: {...} }

      // 👉 On success: store token or session as your app requires
      // localStorage.setItem("token", data.token) // if your backend returns a token

      // 👉 Navigate to the next page (uncomment if using react-router)
      navigate("/v1/jobs", { replace: true });

    } catch (err) {
      setServerError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 grid place-items-center bg-transparent">
  {/* Header / Hero (consistent gradient like Insights) */}
  <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 border-b border-slate-800 border-rounded">
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="text-2xl font-bold tracking-tight text-slate-100">
          Virtual TA <span className="text-indigo-400">Login</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Secure sign‑in for recruiters to access the dashboard
        </p>
      </div>
    </div>
  </div>

  {/* Body */}
  <div className="flex-1 grid place-items-center px-4 sm:px-6">
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          Recruiter Login
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to continue to your dashboard.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recruiter@company.com"
              autoComplete="email"
              className={`w-full rounded-lg border bg-slate-900/60
                px-3 py-2 text-sm text-slate-100
                placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-indigo-400
                ${
                  errors.email
                    ? "border-rose-500/60 focus:ring-rose-400"
                    : "border-slate-700"
                }`}
            />
            {errors.email ? (
              <p className="text-xs text-rose-400">{errors.email}</p>
            ) : null}
          </div>

          {/* Password with eye / eye-off */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full rounded-lg border bg-slate-900/60
                  px-3 py-2 pr-10 text-sm text-slate-100
                  placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-400
                  ${
                    errors.password
                      ? "border-rose-500/60 focus:ring-rose-400"
                      : "border-slate-700"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-0 mr-2 inline-flex items-center rounded p-2 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-rose-400">{errors.password}</p>
            ) : null}
          </div>

          {serverError ? (
            <div className="rounded-md border border-rose-700/50 bg-rose-900/20 p-3 text-sm text-rose-300">
              {serverError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Virtual TA (TA‑AI)
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-slate-400">
        <a className="hover:text-slate-200 hover:">Need Help, Contact Admin</a></div>
    </div>
  </div>
</div>
  );}

/* === Icons (inline SVG) === */
function EyeIcon(props) {
  return (
    <svg
      {...props}
      className={`h-5 w-5 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg
      {...props}
      className={`h-5 w-5 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94C16.23 19.27 14.22 20 12 20 5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-5.94" />
      <path d="M10.58 10.58a3 3 0 1 0 4.24 4.24" />
      <path d="m1 1 22 22" />
      <path d="M9.88 4.26C10.57 4.09 11.28 4 12 4c7 0 11 8 11 8a21.85 21.85 0 0 1-3.06 4.53" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );
}
