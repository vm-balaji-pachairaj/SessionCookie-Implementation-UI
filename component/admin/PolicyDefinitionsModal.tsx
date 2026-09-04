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

/**
 * Renders one policy definition, choosing its fields based on `def.ptype`
 * so the same modal works for both 'p' (permission) and 'p2' (menu) rows.
 */
function DefinitionFields({ def }: { def: PolicyDefinition }) {
  if (def.ptype === "p2") {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-400">LOB</dt>
          <dd className="font-medium text-slate-800 uppercase">
            {def.lob || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Parent</dt>
          <dd className="font-medium text-slate-800">
            {def.parent || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Display Name</dt>
          <dd className="font-medium text-slate-800">
            {def.displayName || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Route</dt>
          <dd className="font-medium text-slate-800">
            {def.route || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Order</dt>
          <dd>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {def.order ?? "—"}
            </span>
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
      <div>
        <dt className="text-xs text-slate-400">LOB</dt>
        <dd className="font-medium text-slate-800 uppercase">
          {def.lob || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-slate-400">Page</dt>
        <dd className="font-medium text-slate-800">{def.page || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-400">Module</dt>
        <dd className="font-medium text-slate-800">{def.module || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-400">Section</dt>
        <dd className="font-medium text-slate-800">{def.section || "—"}</dd>
      </div>
      {def.ptype === "p3" && (
        <div>
          <dt className="text-xs text-slate-400">Field</dt>
          <dd className="font-medium text-slate-800">{def.field || "—"}</dd>
        </div>
      )}
      <div>
        <dt className="text-xs text-slate-400">Access</dt>
        <dd>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            {def.access || "—"}
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Policy Definition
            </h3>
            <p className="mt-0.5 max-w-md truncate font-mono text-xs text-slate-500">
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(80vh-72px)] px-6 py-4">
          {definitions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No definitions found.
            </p>
          ) : (
            <div className="space-y-3">
              {definitions.map((def, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Definition {idx + 1}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        def.ptype === "p2"
                          ? "bg-sky-50 text-sky-700"
                          : def.ptype === "p3"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      {def.ptype.toUpperCase()}
                    </span>
                  </p>
                  <DefinitionFields def={def} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
