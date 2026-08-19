"use client";

import { useSameTabSession } from "@/hooks/useSameTabSession";

export default function SameTabSession() {
  const { isActiveTab } = useSameTabSession();

  if (isActiveTab) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">🔒</div>

        <h1 className="mb-3 text-2xl font-semibold text-gray-900">
          Session Blocked
        </h1>

        <p className="mb-2 text-gray-600">
          A new session has been created in another browser tab.
        </p>

        <p className="text-sm text-gray-500">
          This tab session is no longer active. Please continue using the
          application in the latest active tab.
        </p>
      </div>
    </div>
  );
}
