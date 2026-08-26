"use client";

import { useState } from "react";

interface Permission {
  permission: string;
  module: string;
  section: string;
  access: string;
}

interface ReviewPendingPageProps {
  permissions?: Permission[];
}

type RequestType = "New User" | "Update Role" | "Deactivate" | "Activate";

interface PendingItem {
  id: string;
  ntId: string;
  name: string;
  type: RequestType;
  requestedBy: string;
  date: string;
  status: "Pending";
}

const STUB_ITEMS: PendingItem[] = [
  {
    id: "REQ-001",
    ntId: "alice.wonder",
    name: "Alice Wonder",
    type: "New User",
    requestedBy: "john.doe",
    date: "2026-08-19",
    status: "Pending",
  },
  {
    id: "REQ-002",
    ntId: "bob.jones",
    name: "Bob Jones",
    type: "Update Role",
    requestedBy: "jane.smith",
    date: "2026-08-20",
    status: "Pending",
  },
  {
    id: "REQ-003",
    ntId: "carol.white",
    name: "Carol White",
    type: "Deactivate",
    requestedBy: "john.doe",
    date: "2026-08-21",
    status: "Pending",
  },
  {
    id: "REQ-004",
    ntId: "dave.black",
    name: "Dave Black",
    type: "Activate",
    requestedBy: "jane.smith",
    date: "2026-08-21",
    status: "Pending",
  },
];

const TYPE_COLORS: Record<RequestType, string> = {
  "New User":    "bg-blue-50 text-blue-700",
  "Update Role": "bg-amber-50 text-amber-700",
  "Deactivate":  "bg-red-50 text-red-600",
  "Activate":    "bg-emerald-50 text-emerald-700",
};

export default function ReviewPendingPage({ permissions }: ReviewPendingPageProps) {
  const [items, setItems] = useState<PendingItem[]>(STUB_ITEMS);
  const [reviewedId, setReviewedId] = useState<string | null>(null);

  const canReview = permissions?.some((p) => p.module === "reviewPending");

  function handleAction(id: string, _action: "approve" | "reject") {
    setReviewedId(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          User Management
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Review Pending
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve or reject pending user requests.
        </p>
      </div>

      {/* Success toast */}
      {reviewedId && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ Request {reviewedId} has been processed.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Pending Requests</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            {items.length} pending
          </span>
        </div>

        {items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">
            No pending requests.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Request ID", "NT ID", "Name", "Type", "Requested By", "Date", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    {item.id}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">
                    {item.ntId}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {item.name}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{item.requestedBy}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{item.date}</td>
                  <td className="px-5 py-4">
                    {canReview ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(item.id, "approve")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(item.id, "reject")}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No access</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
