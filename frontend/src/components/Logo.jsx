export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-8 w-8 rounded-md bg-indigo-600 dark:bg-indigo-500 grid place-items-center text-white font-bold">
        TA
      </div>
      <div className="text-lg font-semibold tracking-tight">
        Virtual TA <span className="text-slate-500 dark:text-slate-400">(TA‑AI)</span>
      </div>
    </div>
  )
}
