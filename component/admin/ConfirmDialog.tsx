"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-[#C81E1E]">
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>

        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="rounded-lg bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
