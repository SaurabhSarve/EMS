import { X } from "lucide-react";

const STATUS_STYLES = {
  Ongoing: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700",
  Pending: "bg-amber-100 text-amber-700",
  Archived: "bg-slate-200 text-slate-600",
};

const PRIORITY_STYLES = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

export const StatusBadge = ({ value }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[value] || "bg-slate-100 text-slate-600"}`}>
    {value}
  </span>
);

export const PriorityBadge = ({ value }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_STYLES[value] || "bg-slate-100 text-slate-600"}`}>
    {value}
  </span>
);

export const ProgressBar = ({ value }) => (
  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
    <div
      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export const ViewToggle = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
    {["table", "cards"].map((mode) => (
      <button
        key={mode}
        onClick={() => onChange(mode)}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
          value === mode ? "bg-blue-600 text-white" : "text-slate-600 hover:text-blue-600"
        }`}
        type="button"
      >
        {mode}
      </button>
    ))}
  </div>
);

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
        disabled={page === 1}
      >
        Previous
      </button>
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
              page === item
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export const EmptyState = ({ title, description, action }) => (
  <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center">
    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-blue-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};
