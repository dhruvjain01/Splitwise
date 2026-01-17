export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-sm font-semibold text-slate-700">{label}</label>
      ) : null}

      <input
        {...props}
        className={[
          "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900",
          "placeholder:text-slate-400",
          "focus:border-slate-900",
          "transition",
          className,
        ].join(" ")}
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
