"use client";

export interface PolicyDefinition {
  ptype: "p" | "p2" | "p3";
  // p-type fields (also reused by p3)
  lob?: string | null;
  page?: string | null;
  module?: string | null;
  section?: string | null;
  access?: string | null;
  // p3-type field
  field?: string | null;
  // p2-type fields
  parent?: string | null;
  displayName?: string | null;
  route?: string | null;
  icon?: string | null;
  order?: number | null;
}

interface PolicyDefinitionsModalProps {
  title: string;
  definitions: PolicyDefinition[];
  onClose: () => void;
}

function DefinitionFields({ def }: { def: PolicyDefinition }) {
  if (def.ptype === "p2") {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-slate-400">LOB</dt>
          <dd className="mt-0.5 font-bold uppercase text-slate-900">
            {def.lob || "—"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">Parent Menu</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            {def.parent || "—"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">Display Name</dt>
          <dd className="mt-0.5 font-bold text-slate-900">
            {def.displayName || "—"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">Route</dt>
          <dd className="mt-0.5 font-mono text-slate-700">
            {def.route || "—"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">Display Order</dt>
          <dd className="mt-0.5">
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {def.order ?? "—"}
            </span>
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
      <div>
        <dt className="font-semibold text-slate-400">LOB</dt>
        <dd className="mt-0.5 font-bold uppercase text-slate-900">
          {def.lob || "—"}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">Page</dt>
        <dd className="mt-0.5 font-medium text-slate-800">{def.page || "—"}</dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">Module</dt>
        <dd className="mt-0.5 font-medium text-slate-800">{def.module || "—"}</dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-400">Section</dt>
        <dd className="mt-0.5 font-medium text-slate-800">{def.section || "—"}</dd>
      </div>
      {def.ptype === "p3" && (
        <div>
          <dt className="font-semibold text-slate-400">Field</dt>
          <dd className="mt-0.5 font-mono font-bold text-slate-900">{def.field || "—"}</dd>
        </div>
      )}
      <div>
        <dt className="font-semibold text-slate-400">Access Level</dt>
        <dd className="mt-0.5">
          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            • {def.access || "Read"}
          </span>
        </dd>
      </div>
    </dl>
  );
}

export default function PolicyDefinitionsModal({
  title,
  definitions,
  onClose,
}: PolicyDefinitionsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-[#C81E1E]">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Policy Definition Inspector
              </h3>
              <p className="font-mono text-xs text-[#C81E1E] font-semibold">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {definitions.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No definition found for this policy.
            </p>
          ) : (
            <div className="space-y-4">
              {definitions.map((def, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:bg-slate-50"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-600">
                      Rule Definition #{idx + 1}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        def.ptype === "p2"
                          ? "bg-purple-100 text-purple-700"
                          : def.ptype === "p3"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      Type: {def.ptype}
                    </span>
                  </div>
                  <DefinitionFields def={def} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
