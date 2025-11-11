export default function TextInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-lg border bg-white dark:bg-slate-900/60
          px-3 py-2 text-sm text-slate-900 dark:text-slate-100
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
          ${error ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700'}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
