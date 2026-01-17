export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-base font-extrabold tracking-tight text-slate-900">
            {title}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* ✅ scrollable body */}
        <div className="max-h-[85vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
