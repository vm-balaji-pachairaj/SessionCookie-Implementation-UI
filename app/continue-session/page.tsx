"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../common";
import { ShieldIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

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
    <main className="min-h-screen bg-white flex items-center justify-center px-4 font-sans relative">
      <div className="fixed inset-0 bg-neutral-900/20 backdrop-blur-xs" />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-neutral-200">
        {/* Brand Icon Header */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-[#C81E1E]">
          <ShieldIcon size={24} />
        </div>

        {/* Heading */}
        <h1 className="text-center text-lg font-bold text-neutral-900">
          Existing Session Detected
        </h1>

        {/* Message */}
        <p className="mt-2 text-center text-xs leading-relaxed text-neutral-500">
          An active session is already associated with this account. Would you like to terminate older instances and continue here?
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleContinue}
            disabled={loading}
            isLoading={loading}
            className="flex-1"
          >
            Continue Session
          </Button>
        </div>
      </div>
    </main>
  );
}
