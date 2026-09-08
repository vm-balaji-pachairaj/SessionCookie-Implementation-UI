"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

export default function ReviewPendingPage({
  permissions,
}: ReviewPendingPageProps) {
  const [items, setItems] = useState<PendingItem[]>(STUB_ITEMS);
  const [reviewedId, setReviewedId] = useState<string | null>(null);

  const canReview = permissions?.some((p) => p.module === "reviewPending");

  function handleAction(id: string, _action: "approve" | "reject") {
    setReviewedId(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          User Operations
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
          Review Pending Requests
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          Approve or reject pending access and lifecycle requests.
        </p>
      </div>

      {/* Success toast */}
      {reviewedId && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-700">
          ✓ Request {reviewedId} has been processed.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-sm font-bold text-neutral-900">
            Pending Queue
          </h2>
          <Badge variant="neutral" dot>
            {items.length} pending
          </Badge>
        </div>

        {items.length === 0 ? (
          <p className="px-6 py-12 text-center text-xs text-neutral-400">
            No pending requests awaiting approval.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3.5">Request ID</th>
                  <th className="px-5 py-3.5">NT ID</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Requested By</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/70 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-semibold text-neutral-900">
                      {item.id}
                    </td>
                    <td className="px-5 py-4 font-mono text-neutral-600">
                      {item.ntId}
                    </td>
                    <td className="px-5 py-4 font-bold text-neutral-800">
                      {item.name}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="neutral">{item.type}</Badge>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {item.requestedBy}
                    </td>
                    <td className="px-5 py-4 text-neutral-500 font-mono text-[11px]">
                      {item.date}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canReview ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction(item.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAction(item.id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400">
                          Review access restricted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
