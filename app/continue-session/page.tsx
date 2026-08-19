"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../common";

export default function ContinueSessionPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState<null | { username: string; password: string }>(
    () => {
      if (typeof window === "undefined") return null;
      try {
        const raw = sessionStorage.getItem("pending_login_credentials");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("pending_login_credentials");
      if (raw) setCreds(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to read pending credentials:", e);
    }
  }, []);

  const handleContinue = async () => {
    setError("");
    try {
      setLoading(true);

      // Ensure we have credentials to send
      if (!creds) {
        setError("Missing credentials for continuing session.");
        router.push("/login");
        return;
      }

      // Call backend to continue the existing session. Backend should
      // set HttpOnly cookies (access_token, refresh_token) on success.
      await apiRequest.post("/continue-session", {
        username: creds.username,
        password: creds.password,
      });

      // Cleanup stored credentials
      try {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("pending_login_credentials");
        }
      } catch {}

      // If successful, go to application home
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Failed to continue session:", err);

      const message = err?.response?.data?.message || "Failed to continue session.";
      setError(Array.isArray(message) ? message.join(", ") : message);

      // Fallback: send user back to login
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending_login_credentials");
      }
    } catch {}

    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-8">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <svg
            className="h-7 w-7 text-blue-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.008M10.29 3.86l-7.04 12.18A2 2 0 005 19h14a2 2 0 001.75-2.96L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Existing Session Found
        </h1>

        {/* Message */}
        <p className="mt-4 text-center text-sm leading-6 text-gray-600">
          There is already a session available for this user. Do you want to
          continue with the existing session here?
        </p>

        {error && (
          <div className="mt-4 mb-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Continuing..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
