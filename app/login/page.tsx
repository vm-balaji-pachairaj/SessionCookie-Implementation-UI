"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../common";
import { ShieldIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/login", {
        username,
        password,
      });

      // Backend sets access_token and refresh_token in HttpOnly cookies.
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending_login_credentials");
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      // Network error - backend not reachable
      if (
        error?.code === "ERR_NETWORK" ||
        (error?.message && error.message.includes("Network Error"))
      ) {
        const backendUrl = "http://localhost:5000";
        setError(
          `Unable to connect to backend API at ${backendUrl}. ` +
          'Make sure the backend server is running with "npm run start:dev" from the api folder.'
        );
        return;
      }

      // If backend reports an existing session, redirect to continue-session
      if (
        error?.response?.status === 409 &&
        error?.response?.data?.code === "USER_ALREADY_LOGGED_IN"
      ) {
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              "pending_login_credentials",
              JSON.stringify({ username, password })
            );
          } catch (e) {
            console.error("Failed to save pending credentials:", e);
          }
        }

        router.push("/continue-session");
        return;
      }

      const message =
        error?.response?.data?.message ||
        "Unable to login. Please check your credentials.";

      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-sm">
        {/* Main Login Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          {/* Brand Icon Header with Theme Color (#C81E1E) */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C81E1E] text-white shadow-2xs mb-3">
              <ShieldIcon size={22} />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Portal Sign In
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Enter your credentials to access your session
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 leading-relaxed">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="e.g. admin or alice"
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400 disabled:opacity-50"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
            <p className="text-[11px] text-neutral-400">
              HttpOnly Session Cookies • Casbin Authorization
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
